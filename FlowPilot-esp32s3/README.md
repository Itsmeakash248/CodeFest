# FlowPilot ESP32-S3

<div align="center">

**An intelligent companion-robot firmware for the ESP32-S3**<br />
30 FPS expressive display · dual H-bridge kinematics · hardware telemetry · optional WS2812 lighting · Wi-Fi station mode · browser control dashboard.

[![ESP-IDF](https://img.shields.io/badge/ESP--IDF-v6.1%20%7C%20v5.x-blue.svg)](https://docs.espressif.com/projects/esp-idf/)
[![Target](https://img.shields.io/badge/Target-ESP32--S3-red.svg)](https://www.espressif.com/en/products/socs/esp32-s3)
[![Display](https://img.shields.io/badge/Display-ILI9341%20%2B%20XPT2046-green.svg)](https://github.com/lovyan03/LovyanGFX)
[![Motor Driver](https://img.shields.io/badge/Motor%20Driver-L829%20%2F%20L298N-orange.svg)](docs/MOTOR_DRIVER.md)
[![License](https://img.shields.io/badge/License-MIT-lightgrey.svg)](LICENSE)

</div>

---

## Role in ViewPilot

This firmware is the **optional backup interviewer** for the ViewPilot project in the parent repository. ViewPilot is an AI-powered interview coach; the robot adds a physical face and a fallback demo presence.

- ViewPilot calls this robot through its server-side `/api/robot` proxy when `ROBOT_BASE_URL` is set.
- The current firmware exposes face emotion, action and telemetry endpoints. It does **not** generate questions, score answers or store transcripts.
- Every ViewPilot interview and report works with the robot powered off. The robot is never a dependency.
- The robot API is an unauthenticated LAN service. Keep it on a trusted local network and never expose it to the public internet.

See the [parent README](../README.md) for the product, and [`Codefest-Practice/README.md`](../Codefest-Practice/README.md) for the web app and robot bridge.

---

## Highlights

### 1. Expressive robot face (`RobotFace`)

- **Display pipeline**: LovyanGFX on a 320×240 ILI9341 LCD over SPI2. A 16-bit `LGFX_Sprite` canvas is composed in RAM/PSRAM and pushed to the panel over DMA-capable SPI. The render task targets **~30 FPS**, with cooperative yielding to keep Core 1 responsive.
- **Procedural animation**: smooth eye saccades, blinking, pupil dilation, breathing motion, eyebrow motion and voice-wave mouth animation.
- **Emotion state machine**: `Neutral`, `Happy`, `Curious`, `Surprised`, `Focused`, `Sleepy`, `Wink`, `Sad`, `Rage`, and the festive `Dasara` edition (Chandan/Kumkum tilak, twin Diya lamps and sparkles). `Dasara` is the boot-time default.
- **Touch tracking**: the XPT2046 controller provides gaze tracking and tap input. A quick tap cycles to the next emotion; a tap on the telemetry badge cycles the badge mode.
- **HUD telemetry**: FPS, per-core CPU load and free heap can be shown in the on-screen badge, alongside a compact Wi-Fi link indicator grouped with the top-left battery/status HUD.

### 2. L298N / L829 dual H-bridge motor driver (`MotorDriver`)

- **Silent ultrasonic PWM**: 20 kHz LEDC PWM at 10-bit resolution (0–1023), avoiding audible motor whine.
- **Two control modes**:
  - **4-wire direct PWM (default)**: ENA/ENB jumpers stay fitted to 5 V; speed and direction are driven directly on IN1–IN4. This uses four GPIOs.
  - **6-wire enable mode (optional)**: remove the ENA/ENB jumpers and drive ENA/ENB with PWM while IN1–IN4 set direction.
- **Differential drive**: `drive(throttle, steering)` mixes arcade-style throttle and steering, with proportional scaling that preserves the turn radius at high speed.
- **Soft start**: configurable slew-rate ramping reduces brownout risk when the motors start under load.
- **Deadzone compensation**: overcomes static gearbox friction at low duty cycles.
- **Braking or coasting**: active short-circuit braking or free-wheeling stop, selectable per call.

### 3. Optional WS2812 RGB LED (`RgbLed`)

- Controls the onboard WS2812/NeoPixel on **GPIO 48**.
- **Disabled by default** (`ENABLE_RGB_LED = 0` in `main/main.cpp`) to keep the boot current low. Set the toggle to `1` to enable it.
- **Hardware brightness cap**: `MAX_BRIGHTNESS_LIMIT = 51 / 255` (20%) protects eyes and reduces brownout risk.
- **Modes**: solid, breathing, rainbow, blink/strobe, and `EmotionSync`, which follows the active face palette and breath cycle.

### 4. Dual-core architecture

- **Core 0 (`robot_control_task`, 100 Hz)**: kinematics, autonomous behavior, motor slew-rate updates, optional LED sync, telemetry sampling and periodic serial logging.
- **Core 1 (`robot_render_task`, ~30 FPS)**: face rendering, SPI display push, touch sampling and gesture handling.
- **`app_main`**: boot diagnostics, Wi-Fi bring-up, display/touch initialization, optional LED and motor initialization, then task creation.

### 5. Wi-Fi station mode

- `ENABLE_WIFI = 1` by default. The firmware connects as a **Wi-Fi station** (STA), retries on disconnect, disables modem sleep and caps TX power at 10 dBm.
- The current firmware does **not** create a SoftAP. Link state is shown as a compact inline indicator in the top-left HUD, grouped with the battery and `SYS.OK` label: four bars follow the live RSSI (white, cyan, amber or red), and the Wi-Fi fan blinks with a slash while the station reconnects. Telemetry is also printed to the serial console every 5 seconds.
- Credentials are defined in `main/main.cpp` (`WIFI_SSID`, `WIFI_PASS`). Replace them before publishing the project.

### 6. LAN web control dashboard (`WebDashboard`)

- A self-contained command deck is embedded in flash and served by `esp_http_server` at **`http://<esp32-ip>/`** (port 80). No Internet connection, CDN or companion app is required.
- Open the IP printed by the `WIFI_STA` log line, for example:

  ```text
  I (4120) WIFI_STA: Connected! Got IP: 192.168.1.42
  I (4120) WIFI_STA: Web dashboard: http://192.168.1.42/
  ```

- The dashboard provides full current-build control: differential drive with a joystick or `WASD`/arrow keys, speed limit, emergency stop, all ten face emotions, autonomous-behavior toggle, gaze pad, blink/wink/next-face actions, HUD overlay mode/dock position, and display brightness. It also mirrors live telemetry: Wi-Fi RSSI/IP, uptime, FPS, per-core CPU load, free heap, motor outputs and brake state.
- **Drive dead-man:** the browser sends drive updates at 10 Hz. If they stop for **800 ms** (tab closed, Wi-Fi drop, browser crash), `WebDashboard::update()` brakes the motors. Releasing the joystick, pressing `Space` (unless a button has focus), hiding the tab, or a failed status poll also sends an immediate stop.
- **Safety / scope:** the server is **LAN-only and has no authentication**. Run it on a trusted network and do not port-forward it. The dashboard intentionally does not expose the destructive motor self-test. There is no mDNS advertisement yet; use the IP from the serial log.
- Manual emotion, wink/next and gaze commands automatically switch off autonomous gaze/emotion drift so the selected expression and gaze hold.

#### REST API

All command routes are `POST` with query parameters and return `{"ok":true}`. `GET /api/status` returns the telemetry snapshot consumed by the dashboard.

| Route | Parameters | Purpose |
| :--- | :--- | :--- |
| `GET /` | — | Embedded dashboard HTML/CSS/JS |
| `GET /api/status` | — | Wi-Fi, emotion, autonomy, perf, HUD, display and motor JSON |
| `POST /api/drive` | `throttle=-1..1`, `steering=-1..1` | Differential drive; feeds the 800 ms dead-man lease |
| `POST /api/stop` | — | Immediate active brake and disarm remote drive |
| `POST /api/emotion` | `id=0..9` or `name=Happy`; optional `immediate=1` | Set a face expression |
| `POST /api/action` | `type=blink\|wink\|next` | Trigger a face action |
| `POST /api/look` | `x=-1..1`, `y=-1..1` | Move the gaze target |
| `POST /api/overlay` | `mode=0..3`, `position=0..3` | Configure the on-screen performance HUD |
| `POST /api/autonomy` | `enabled=0\|1` | Pause/resume autonomous gaze and emotion drift |
| `POST /api/display` | `value=0..255` | Set LCD backlight brightness |

> [!WARNING]
> The API has no authentication or CSRF protection. Treat the robot's Wi-Fi network as a trusted control network.

---

## Current feature toggles

These are compile-time `#define`s at the top of `main/main.cpp`:

| Toggle | Default | Effect |
| :--- | :---: | :--- |
| `ENABLE_WIFI` | `1` | Wi-Fi station bring-up and reconnect handling. |
| `ENABLE_WEB_DASHBOARD` | `1` | Embedded LAN dashboard and REST API. Requires `ENABLE_WIFI=1`. Set to `0` to remove the HTTP server. |
| `ENABLE_ROBOT_SUBSYSTEMS` | `1` | Display, touch, motors and the two robot tasks. Set to `0` for a Wi-Fi-only build. |
| `ENABLE_MOTOR_TEST` | `0` | Starts the 8-phase motor self-test on Core 0 after motor init. |
| `ENABLE_RGB_LED` | `0` | Initializes the onboard WS2812 on GPIO 48. When disabled, GPIO 48 is held low. |

---

## Master hardware pinout

The GPIO map avoids the octal PSRAM/flash pins (`GPIO 26–32`), USB JTAG (`GPIO 19, 20`) and UART0 (`GPIO 43, 44`).

| Function | Pin name | ESP32-S3 GPIO | Bus / interface | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | LCD MOSI | **GPIO 11** | SPI2 (FSPI) | Shared SPI bus |
| | LCD MISO | **GPIO 13** | SPI2 (FSPI) | Shared SPI bus |
| | LCD SCLK | **GPIO 12** | SPI2 (FSPI) | Shared SPI bus, 40 MHz write |
| | LCD CS | **GPIO 10** | SPI chip select | Active LOW |
| | LCD DC | **GPIO 9** | Data/command | |
| | LCD RST | **GPIO 14** | Reset | Active LOW |
| | LCD BL | **GPIO 7** | PWM backlight | LEDC channel 0, 20 kHz |
| **Touch** | Touch CS | **GPIO 5** | SPI chip select | Active LOW, 1 MHz |
| | Touch INT | **GPIO 6** | Interrupt | Pen-down IRQ |
| **Motor driver** | IN1 (Motor A PWM 1) | **GPIO 15** | LEDC channel 1 | Left motor, direct PWM |
| **(L298N / L829)** | IN2 (Motor A PWM 2) | **GPIO 16** | LEDC channel 2 | Left motor, direct PWM |
| | IN3 (Motor B PWM 1) | **GPIO 18** | LEDC channel 3 | Right motor, direct PWM |
| | IN4 (Motor B PWM 2) | **GPIO 17** | LEDC channel 4 | Right motor, direct PWM |
| | ENA / ENB | *None* | 5 V jumpers | Excluded in the default 4-wire build |
| **Onboard RGB** | WS2812 DIN | **GPIO 48** | RMT / SPI strip | Optional; disabled by default |
| **Console** | USB Serial/JTAG | native USB | — | `sdkconfig.defaults` selects USB Serial/JTAG |

> [!TIP]
> The default build keeps the factory **ENA/ENB 5 V jumper caps installed** and controls speed directly on IN1–IN4 (GPIO 15, 16, 18, 17). Motor A is the left channel and Motor B is the right channel in the default drive mixing; `invertRight = true` is the default because the right motor is normally mounted mirrored. Use `setInverted(left, right)` if your chassis is wired differently. See the **[Motor Driver Hardware Guide](docs/MOTOR_DRIVER.md)**.

---

## Project structure

```text
FlowPilot-esp32s3/
├── CMakeLists.txt                 # Root ESP-IDF project configuration
├── README.md                      # This document
├── sdkconfig.defaults             # ESP32-S3 defaults (16 MB flash, octal PSRAM, USB console)
├── partitions.csv                 # OTA + FATFS partition layout
├── docs/
│   └── MOTOR_DRIVER.md            # L298N / L829 wiring, power and API guide
├── components/
│   └── LovyanGFX/                 # Display driver component
├── main/
│   ├── CMakeLists.txt             # Main component sources and dependencies
│   ├── idf_component.yml          # ESP-IDF component manager dependencies
│   ├── main.cpp                   # app_main, Wi-Fi bring-up, dual-core task orchestration
│   ├── LGFX_Config.hpp            # ILI9341 bus, panel, backlight and XPT2046 setup
│   ├── RobotFace.hpp / .cpp       # Procedural face, emotions, touch handling and HUD
│   ├── WebDashboard.hpp / .cpp    # HTTP server, REST API and drive dead-man lease
│   ├── web/index.html             # Embedded responsive command-deck UI
│   ├── MotorDriver.hpp / .cpp     # L298N / L829 dual H-bridge driver
│   ├── MotorTest.hpp / .cpp       # 8-phase motor hardware self-test task
│   ├── PerfMonitor.hpp / .cpp     # FPS, CPU-load and heap telemetry
│   ├── RgbLed.hpp / .cpp          # Optional WS2812 controller
│   ├── L829Driver.hpp             # Forwarding header for L829 naming
│   ├── L298NDriver.hpp            # Forwarding header for L298N naming
│   └── assets/                    # Optional image assets
└── managed_components/            # Generated by the component manager (gitignored)
```

---

## Build and flash

### Prerequisites

- **ESP-IDF**: 5.1 or newer (tested on **ESP-IDF 6.1**).
- **Target hardware**: ESP32-S3 development board with 16 MB flash and 8 MB octal PSRAM.
- **Display**: 2.8" or 3.2" SPI ILI9341 (320×240) with XPT2046 touch controller.
- **Motor driver**: L298N / L829 dual H-bridge with two DC gearmotors.
- **Power**: separate motor battery (7.4–12 V) and a common ground with the ESP32-S3.

### Build

```bash
# Source the ESP-IDF environment
. $HOME/esp/esp-idf/export.sh
# or, for a local install:
# . ~/.espressif/v6.1/esp-idf/export.sh

# Select the target on a fresh checkout
idf.py set-target esp32s3

# Compile
idf.py build
```

### Flash and monitor

```bash
# Replace /dev/ttyACM0 with your serial port
idf.py -p /dev/ttyACM0 flash monitor
```

Press `Ctrl+]` to exit the serial monitor.

> [!NOTE]
> `sdkconfig.defaults` enables 16 MB QIO flash, 80 MHz octal PSRAM, USB Serial/JTAG console, a 160 MHz CPU clock, 10 dBm Wi-Fi TX power, and disables the brownout detector. `idf.py set-target` can regenerate `sdkconfig`; review the generated file if you have board-specific settings.

---

## Code examples

### Differential drive

```cpp
#include "MotorDriver.hpp"

MotorDriver& motors = getMotorDriver();

motors.drive(1.0f, 0.0f);    // Straight forward at 100%
motors.drive(-0.5f, 0.0f);   // Reverse at 50%
motors.drive(0.8f, 0.4f);    // Forward with a right turn
motors.spinLeft(0.7f);       // Spin in place counter-clockwise

motors.stop(true);           // Active electrical brake
motors.stop(false);          // Free-wheeling coast
```

### Cycling face emotions

```cpp
#include "RobotFace.hpp"

robotFace.setEmotion(RobotEmotion::Happy);
robotFace.setEmotion(RobotEmotion::Surprised);  // “Excited” is not an enum value
robotFace.nextEmotion();
```

### Custom motor configuration

```cpp
MotorDriverConfig cfg;

// Default 4-wire direct PWM: keep ENA/ENB jumpers installed.
cfg.mode = MotorControlMode::PwmDirectPins;
cfg.in1Pin = GPIO_NUM_15;   // Motor A / left
cfg.in2Pin = GPIO_NUM_16;
cfg.in3Pin = GPIO_NUM_18;   // Motor B / right
cfg.in4Pin = GPIO_NUM_17;
cfg.enaPin = GPIO_NUM_NC;
cfg.enbPin = GPIO_NUM_NC;
cfg.slewRate = 2.0f;        // Gentler acceleration
cfg.minSpeed = 0.20f;       // Deadzone compensation
cfg.invertLeft = false;
cfg.invertRight = true;     // Mirrored right motor

getMotorDriver().setConfig(cfg);
```

To use 6-wire enable mode, remove the ENA/ENB jumpers and set the mode explicitly:

```cpp
MotorDriverConfig cfg;
cfg.mode = MotorControlMode::PwmEnablePins;
cfg.enaPin = GPIO_NUM_4;    // Choose free pins
cfg.enbPin = GPIO_NUM_8;
cfg.in1Pin = GPIO_NUM_15;
cfg.in2Pin = GPIO_NUM_16;
cfg.in3Pin = GPIO_NUM_18;
cfg.in4Pin = GPIO_NUM_17;

getMotorDriver().setConfig(cfg);
```

> Setting `enaPin`/`enbPin` alone does not switch modes. The default `mode` is `PwmDirectPins`; set `MotorControlMode::PwmEnablePins` explicitly.

---

## Telemetry and diagnostics

- **Display HUD**: the face overlay can show FPS, per-core CPU usage and free heap. Tap the badge to cycle `Off → Compact → Detailed → Minimal`.
- **Serial log**: every 5 seconds the control task prints display FPS, per-core CPU load, heap, current emotion, motor speeds and the active motor-test phase.
- **Motor self-test**: set `ENABLE_MOTOR_TEST = 1` and rebuild. The test task runs on Core 0 at priority 3 and exercises left/right isolation, forward/reverse, braking, dual-motor drive, pivot spins and a slew-rate ramp. Keep the robot raised during the test.
- **Performance monitor**: `PerfMonitor` samples FreeRTOS idle-task counters for CPU load and smooths FPS over a ~350 ms window.

---

## Power and troubleshooting

- **Motor supply vs ESP32 supply**: always power the DC motors through an external battery pack (7.4–12 V). **Connect all grounds (ESP32 GND, battery GND, L298N GND) together.**
- **Brownout resets**: sudden motor transitions can pull the battery rail down. Slew-rate ramping is enabled by default. Add a 220–470 µF bulk capacitor across the L298N `V_S`/GND terminals and use a battery that can supply the motor stall current.
- **Brownout detector**: the firmware calls `esp_brownout_disable()` during bring-up and caps Wi-Fi TX power to reduce false resets on USB power. This is a bring-up workaround, not a substitute for a proper supply.
- **Touch calibration**: adjust `x_min`, `x_max`, `y_min`, `y_max` in [`main/LGFX_Config.hpp`](main/LGFX_Config.hpp) if touch coordinates are inverted or offset.
- **Display issues**: lower `cfg.freq_write` in `LGFX_Config.hpp` if long jumper wires cause corruption.
- **RGB LED stays dark**: this is expected with `ENABLE_RGB_LED = 0`. Set it to `1` and rebuild.
- **Wi-Fi does not connect**: confirm the board is a 2.4 GHz station, check `WIFI_SSID`/`WIFI_PASS`, and inspect the `WIFI_STA` serial logs. The current firmware does not start an access point.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
