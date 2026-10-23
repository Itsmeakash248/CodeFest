# CodeFest 2026 — Team Mooncraft

**FlowPilot** — drag-and-drop AI workflows that speak, think, and drive a real Wi-Fi robot.

Team Mooncraft · KLE Tech BCA Hackathon · 24 Oct 2026 · Domain: **AI Powered Web Applications**

---

## What is FlowPilot?

FlowPilot turns plain language into a safety-gated workflow:

```text
Text Input → Ask AI → Condition → Car Actuation
```

The **Condition** block is the safety gate: unsafe commands are rejected before they can reach the robot. The workspace contains the web showcase and the ESP32-S3 firmware that implements the robot side.

> [!NOTE]
> `CodeFest_2026_Team_Playbook_Mooncraft.pdf` is the original project brief, prepared on 14 October 2026. It now includes a 22 October 2026 implementation-update appendix. The implementation has since moved from the ESP8266/SoftAP prototype described there to an ESP32-S3/Wi-Fi-station build. Where the brief and the code differ, the appendix and the READMEs in this repository describe the current implementation.

---

## Current status

| Area | Current implementation |
| :--- | :--- |
| **Web showcase** | `Codefest-Practice/` — Next.js 16 landing site with a 3D scroll journey and an interactive Studio mock. The current build has no API routes or backend; Studio runs a local keyword/safety simulation. |
| **Robot firmware** | `FlowPilot-esp32s3/` — ESP32-S3 firmware with a 30 FPS expressive face, touch input, L298N motor control, telemetry, optional WS2812 lighting, and Wi-Fi station bring-up. |
| **Earlier AI prototype** | The pre-rewrite `Codefest-Practice` app (FlowCanvas + API routes + Supabase queue) is preserved in git history and in `Archive/codefest-practice-backup-20261018.bundle`. It is not wired into the current showcase. |
| **Hardware bench tests** | `esp8266-st7735-test/` (ESP8266 + ST7735 info screen) and `wifi_min_test/` (minimal ESP32-S3 Wi-Fi bring-up). These are standalone diagnostics, not part of the main firmware. |
| **Original brief + update** | `CodeFest_2026_Team_Playbook_Mooncraft.pdf` — concept, event details, architecture and judging checklist, plus a 22 Oct 2026 implementation-update appendix. |

---

## Repository layout

```text
CodeFest/
├── Codefest-Practice/              # Next.js 16 showcase site [submodule]
│   ├── src/app/                    # /, /studio, /how, /robot, /stack
│   └── src/lib/site.ts             # central site copy and page metadata
├── FlowPilot-esp32s3/              # ESP32-S3 robot firmware [submodule]
│   ├── main/                       # face, motors, LED, telemetry, Wi-Fi
│   └── docs/MOTOR_DRIVER.md        # L298N / L829 wiring and API guide
├── esp8266-st7735-test/            # standalone ESP8266 display/Wi-Fi test
├── wifi_min_test/                  # minimal ESP32-S3 Wi-Fi station test
├── Archive/                        # historical prototypes and backups
├── CodeFest_2026_Team_Playbook_Mooncraft.pdf
├── Crescent Moon Orbital Star Emblem.png
└── README.md
```

`Codefest-Practice` and `FlowPilot-esp32s3` are git submodules. The two hardware test projects are local, standalone PlatformIO/ESP-IDF projects.

---

## Documentation index

| Document | Contents |
| :--- | :--- |
| [FlowPilot ESP32-S3 firmware](FlowPilot-esp32s3/README.md) | Features, current configuration, pinout, build/flash steps, API examples, power and troubleshooting. |
| [Motor driver guide](FlowPilot-esp32s3/docs/MOTOR_DRIVER.md) | L298N/L829 hardware, 4-wire and 6-wire control modes, power wiring, software API, test suites. |
| [Web showcase](Codefest-Practice/README.md) | Next.js site structure, routes, local development, deployment, and the scope of the Studio simulation. |
| [ESP8266 ST7735 test](esp8266-st7735-test/README.md) | Standalone 128×160 display and Wi-Fi information screen. |
| [ESP32-S3 Wi-Fi test](wifi_min_test/README.md) | Minimal station-mode bring-up used to isolate Wi-Fi/PHY problems. |
| [Archive index](Archive/README.md) | Historical ESP32/ESP8266 prototypes and the pre-rewrite web backup. |
| [Original playbook + update](CodeFest_2026_Team_Playbook_Mooncraft.pdf) | Original concept brief, event information and the 22 Oct 2026 implementation-update appendix. |

---

## Quick start

### Web showcase

Requires **Node.js 20.9+**.

```bash
cd Codefest-Practice
npm install
npm run dev
```

Open <http://localhost:3000>. Production build:

```bash
npm run build
npm start
```

### Robot firmware

Requires **ESP-IDF 5.1+** (tested with ESP-IDF 6.1) and an ESP32-S3 board.

```bash
. $HOME/esp/esp-idf/export.sh
cd FlowPilot-esp32s3

# Fresh checkout: select the target, then build
idf.py set-target esp32s3
idf.py build

# Flash and monitor (replace the port if needed)
idf.py -p /dev/ttyACM0 flash monitor
```

Press `Ctrl+]` to exit the serial monitor. If `sdkconfig` is already present, `idf.py build` can be run directly; `set-target` may regenerate the configuration.

### Clone with submodules

```bash
git clone --recurse-submodules https://github.com/Itsmeakash248/CodeFest.git
cd CodeFest
```

If the repository was cloned without submodules:

```bash
git submodule update --init --recursive
```

---

## Hardware at a glance

| Subsystem | Part / interface |
| :--- | :--- |
| MCU | ESP32-S3, 16 MB QIO flash, 8 MB octal PSRAM |
| Display | 320×240 ILI9341 over SPI2 |
| Touch | XPT2046 resistive touch controller |
| Motor driver | L298N / L829 dual H-bridge, 20 kHz PWM |
| Drive | Two DC gearmotors, differential/skid-steer mixing |
| Lighting | Optional onboard WS2812 on GPIO 48, disabled by default |
| Network | 2.4 GHz Wi-Fi station mode |
| Console | USB Serial/JTAG |

See the [firmware README](FlowPilot-esp32s3/README.md#master-hardware-pinout) for the complete GPIO table.

---

## Safety and secrets

- Power the motors from a separate battery pack and connect **all grounds** together. Do not drive motors from the ESP32 3.3 V/5 V rails.
- Keep the robot raised or on a stand while running the motor self-test.
- Wi-Fi credentials are currently hardcoded in `FlowPilot-esp32s3/main/main.cpp` and `wifi_min_test/main/main.c`. Replace them with local values before publishing or move them into a private configuration file.
- The firmware disables the ESP32 brownout detector during bring-up and limits Wi-Fi TX power to reduce rail collapse; this does **not** replace a properly sized motor supply.

---

## License

The ESP32-S3 firmware is MIT licensed — see [`FlowPilot-esp32s3/LICENSE`](FlowPilot-esp32s3/LICENSE). Other directories follow the license or notice in their own folder.
