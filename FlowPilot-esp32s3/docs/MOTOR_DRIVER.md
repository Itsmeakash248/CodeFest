# L298N / L829 Motor Driver Hardware & Integration Guide

This guide covers the hardware, wiring, power, control modes and software API for the **L298N / L829 dual H-bridge** used by the **FlowPilot ESP32-S3** robot.

---

## 1. Hardware overview

The **L298N** (often labelled or mistyped as **L829**) is a dual full-bridge driver for inductive loads such as DC motors, relays and stepper motors.

### Key specifications

| Parameter | Value |
| :--- | :--- |
| Driver chip | L298N dual H-bridge |
| Motor supply (`V_S`) | 5–35 V (typically 6–12 V for DC gearmotors) |
| Peak current | Up to 2 A per channel |
| Logic supply (`V_SS`) | 5 V (internal regulator when `V_S ≤ 12 V`) |
| Control logic | 3.3 V / 5 V TTL compatible; ESP32-S3 3.3 V logic works directly |
| PWM | 20 kHz ultrasonic, 10-bit LEDC resolution |
| Default control mode | 4-wire direct PWM (per-motor 2-wire) |

---

## 2. Control modes

The driver supports two wiring/software modes. The enum names in `MotorDriver.hpp` are `PwmDirectPins` and `PwmEnablePins`.

### 2.1 4-wire direct PWM (default)

- Keep the factory **ENA/ENB 5 V jumper caps installed**.
- Apply PWM directly to **IN1–IN4**; each motor uses two PWM lines for direction and speed.
- Uses **4 GPIOs** total for two motors.
- `MotorControlMode::PwmDirectPins` is the default.
- This is the configuration used by the stock FlowPilot firmware.

### 2.2 6-wire enable mode (optional)

- **Remove the ENA/ENB jumpers.**
- Drive **ENA/ENB with PWM** and use **IN1–IN4 as direction outputs**.
- Uses **6 GPIOs** total for two motors.
- Set `cfg.mode = MotorControlMode::PwmEnablePins` explicitly and assign `enaPin`/`enbPin`.
- Setting `enaPin`/`enbPin` alone does **not** switch modes, because the default `mode` remains `PwmDirectPins`.

> The code comments call this “3-wire control per motor” because each motor uses ENA/ENB plus two direction pins. For the whole board that is **6 signal wires**, so this guide calls it 6-wire mode to avoid confusion with the 4-wire direct mode.

---

## 3. Default pinout

The stock build uses the following pins:

| L298N / L829 pin | ESP32-S3 GPIO | Function | Notes |
| :--- | :--- | :--- | :--- |
| **ENA** | *None* | 5 V jumper ON | Excluded in 4-wire mode |
| **IN1** | **GPIO 15** | Motor A PWM 1 | Left motor, LEDC channel 1 |
| **IN2** | **GPIO 16** | Motor A PWM 2 | Left motor, LEDC channel 2 |
| **IN3** | **GPIO 18** | Motor B PWM 1 | Right motor, LEDC channel 3 |
| **IN4** | **GPIO 17** | Motor B PWM 2 | Right motor, LEDC channel 4 |
| **ENB** | *None* | 5 V jumper ON | Excluded in 4-wire mode |
| **GND** | **GND** | Common ground | Must be tied to ESP32-S3 ground |
| **+12 V / `V_S`** | External battery (+) | Motor power | 7.4 V (2S LiPo) or 11.1 V (3S LiPo) |
| **+5 V** | 5 V regulator output | Logic power | Leave unconnected when the ESP32 is USB-powered |

> **Motor A / Motor B:** `applyHardwareOutputs()` passes the left speed to IN1/IN2 and the right speed to IN3/IN4. The default `invertRight = true` accounts for a mirrored right motor. If your chassis is wired differently, call `setInverted(left, right)` or swap the motor leads.

### Wiring diagram

```text
                +----------------------------+
                |    L298N / L829 module     |
                |                            |
  [Motor A +]---| OUT1                  OUT3 |--[Motor B +]
  [Motor A -]---| OUT2                  OUT4 |--[Motor B -]
                |                            |
                | [ENA] IN1  IN2  IN3  IN4 [ENB]
                +---+----+----+----+----+---+
                    |    |    |    |    |   |
     [Jumper ON] <--+    |    |    |    |   +--> [Jumper ON]
     (tied to 5 V)       |    |    |    |        (tied to 5 V)
                         |    |    |    +------> ESP32-S3 GPIO 17 (Motor B PWM 2)
                         |    |    +-----------> ESP32-S3 GPIO 18 (Motor B PWM 1)
                         |    +----------------> ESP32-S3 GPIO 16 (Motor A PWM 2)
                         +---------------------> ESP32-S3 GPIO 15 (Motor A PWM 1)

           Power terminals:
           [ +12V ] ---> Battery positive (+) [7.4 V - 12 V]
           [  GND ] ---> Common ground with ESP32-S3 and battery (-)
           [  +5V ] ---> Optional 5 V logic output if the regulator jumper is fitted
```

For 6-wire mode, remove the ENA/ENB jumper caps and connect ENA/ENB to two free GPIOs. Do not use GPIO 5/6/7/9–18, which are already assigned to touch, backlight, display and motors in the stock build.

---

## 4. Power supply and grounding

> [!CAUTION]
> Never power DC motors from the ESP32 development board's 3.3 V or 5 V rails. Motor startup current and inductive spikes can damage the ESP32-S3 or trigger brownout resets.

1. **Common ground**: connect the battery negative, L298N GND and ESP32-S3 GND with a solid, low-resistance wire.
2. **Onboard 5 V regulator jumper**:
   - Motor supply **≤ 12 V**: keep the 5 V regulator jumper **ON**; the module generates its own logic supply.
   - Motor supply **> 12 V**: remove the jumper and supply external +5 V to the +5 V terminal to avoid overheating the linear regulator.
3. **Bulk capacitance**: place a **100–470 µF** electrolytic capacitor across `V_S` and GND to buffer motor startup surges.
4. **Battery current**: choose a pack that can supply the motor stall current. Slew-rate ramping reduces, but does not eliminate, startup current.

---

## 5. Software architecture and API

The driver is exposed as `MotorDriver` and aliased as `L298NDriver`, `L829Driver` and `L829MotorDriver`.

### 5.1 Include and initialize

```cpp
#include "MotorDriver.hpp"
// Or: #include "L298NDriver.hpp"
// Or: #include "L829Driver.hpp"

MotorDriver& motor = getMotorDriver();
esp_err_t err = motor.init();
if (err != ESP_OK) {
    ESP_LOGE("APP", "Motor driver init failed: %s", esp_err_to_name(err));
}
```

### 5.2 Custom pin configuration

Default 4-wire mode:

```cpp
MotorDriverConfig cfg;
cfg.mode = MotorControlMode::PwmDirectPins;  // ENA/ENB jumpers fitted
cfg.in1Pin = GPIO_NUM_15;    // Motor A / left
cfg.in2Pin = GPIO_NUM_16;
cfg.in3Pin = GPIO_NUM_18;    // Motor B / right
cfg.in4Pin = GPIO_NUM_17;
cfg.enaPin = GPIO_NUM_NC;    // Not used
cfg.enbPin = GPIO_NUM_NC;
cfg.invertLeft = false;
cfg.invertRight = true;      // Mirrored right motor
cfg.slewRate = 2.5f;         // Acceleration ramp, units/second

MotorDriver customDriver(cfg);
customDriver.init();
```

6-wire enable mode:

```cpp
MotorDriverConfig cfg;
cfg.mode = MotorControlMode::PwmEnablePins;  // ENA/ENB jumpers removed
cfg.in1Pin = GPIO_NUM_15;
cfg.in2Pin = GPIO_NUM_16;
cfg.in3Pin = GPIO_NUM_18;
cfg.in4Pin = GPIO_NUM_17;
cfg.enaPin = GPIO_NUM_4;     // Choose free pins
cfg.enbPin = GPIO_NUM_8;

MotorDriver customDriver(cfg);
customDriver.init();
```

### 5.3 Differential drive

```cpp
// drive(throttle, steering)
// throttle: [-1.0 .. 1.0]  (-1 = reverse, +1 = forward)
// steering: [-1.0 .. 1.0]  (-1 = full left, +1 = full right)

motor.drive(1.0f, 0.0f);    // Full speed forward
motor.drive(0.5f, -0.3f);   // Half speed, gentle left curve
motor.drive(-0.6f, 0.0f);   // 60% reverse
```

### 5.4 Movement primitives

```cpp
motor.forward(0.8f);       // Forward at 80%
motor.backward(0.5f);      // Reverse at 50%
motor.turnLeft(0.7f);      // Forward arc turn left
motor.turnRight(0.7f);     // Forward arc turn right
motor.spinLeft(0.6f);      // Spin in place counter-clockwise
motor.spinRight(0.6f);     // Spin in place clockwise
motor.stop(true);          // Active electric brake
motor.stop(false);         // Free-wheeling coast
```

### 5.5 Slew-rate ramping

The driver smooths speed changes to reduce brownout risk:

```cpp
motor.update(dt);            // Call from the 100 Hz control loop
motor.setSlewRate(4.0f);     // Fast: 0 → 100% in 250 ms
motor.setSlewRate(1.5f);     // Gentle: 0 → 100% in 667 ms
motor.setSlewRate(0.0f);     // Disable ramping
```

`MotorDriver::update()` is already called from `robot_control_task()` in `main/main.cpp` at 100 Hz. The render task runs separately at ~30 FPS.

### 5.6 Telemetry

```cpp
const MotorTelemetry& t = motor.getTelemetry();

t.currentLeft;   // Smoothed left output [-1.0 .. 1.0]
t.currentRight;  // Smoothed right output [-1.0 .. 1.0]
t.isMoving;      // True while either motor is driving
t.isBraking;     // True while either motor is actively braked
```

---

## 6. Motor test suites

### 6.1 `MotorTest` task (8 phases, Core 0)

Enable the test in `main/main.cpp`:

```cpp
#define ENABLE_MOTOR_TEST 1
```

The task is created after motor initialization. It runs on Core 0 at priority 3.

```cpp
#include "MotorTest.hpp"

// Start with defaults: continuous loop, 40% speed, 3 s countdown
startMotorTestTask();

// Custom configuration
MotorTestConfig testCfg;
testCfg.continuousLoop = false;     // Single cycle
testCfg.testSpeed = 0.40f;
testCfg.stepDurationMs = 1500;
testCfg.pauseDurationMs = 800;
testCfg.countdownSec = 3;
testCfg.cycleRestDurationMs = 4000;
startMotorTestTask(testCfg);

// Stop and brake immediately
stopMotorTestTask();
```

The task exercises:

1. Motor A (left) forward → coast → reverse → active brake.
2. Motor B (right) forward → coast → reverse → active brake.
3. Dual-motor straight forward → active brake.
4. Dual-motor straight reverse → active brake.
5. In-place spin left → spin right.
6. Slew-rate ramp 0 → 60% → 0%.

> Keep the robot raised or on a stand during the test. The task logs each phase and the telemetry snapshot.

### 6.2 `runDiagnosticTest()` (blocking 6-step sequence)

`MotorDriver::runDiagnosticTest(stepDurationMs, speed)` is a simpler blocking sequence for bench checks. It drives Motor A, then Motor B, then both motors, and finishes with a brake. It must be called after `init()`.

---

## 7. Troubleshooting

| Symptom | Probable cause | Recommended solution |
| :--- | :--- | :--- |
| **Motors do not spin at all** | ENA/ENB jumpers removed but the firmware still uses 4-wire mode | Re-fit the ENA/ENB 5 V jumpers, or switch to `MotorControlMode::PwmEnablePins` and assign `enaPin`/`enbPin`. |
| **Motors spin but speed does not change** | PWM is not reaching the IN pins, or the board is in the wrong mode | Confirm the jumpers match the selected mode and that the IN pins are the LEDC channels. |
| **ESP32 reboots when motors start** | Motor inrush current pulls the battery rail down | Use a separate motor battery, add a 220–470 µF capacitor across `V_S`/GND, and lower the slew rate (`motor.setSlewRate(2.0f)`). |
| **Robot steers in the wrong direction** | Motor leads or mounting orientation are mirrored | Call `motor.setInverted(true, false)` (or the opposite pair) or swap the motor leads. |
| **One motor runs backwards** | That motor is mounted or wired in reverse | Set the matching invert flag with `setInverted()` or swap OUT1/OUT2 (or OUT3/OUT4). |
| **High-pitched motor whine** | PWM frequency is below the audible range | The driver defaults to **20 kHz**; verify `pwmFreqHz` and the LEDC timer configuration were not changed. |
| **Motor test starts immediately** | `ENABLE_MOTOR_TEST` is set to `1` | Set it to `0` for normal operation, or call `stopMotorTestTask()`. |

---

## 8. Default configuration summary

| Setting | Default |
| :--- | :--- |
| Control mode | `PwmDirectPins` (4-wire direct PWM) |
| Motor A pins | IN1 = GPIO 15, IN2 = GPIO 16 |
| Motor B pins | IN3 = GPIO 18, IN4 = GPIO 17 |
| ENA / ENB | `GPIO_NUM_NC` (5 V jumpers fitted) |
| PWM frequency | 20 kHz |
| PWM resolution | 10-bit (0–1023) |
| Minimum speed | 0.15 (deadzone compensation) |
| Maximum speed | 1.0 |
| Slew rate | 3.0 units/s |
| Ramping | Enabled |
| Left inversion | `false` |
| Right inversion | `true` |
