#pragma once

#include <cstdint>
#include <algorithm>
#include <cmath>
#include "esp_err.h"
#include "driver/gpio.h"
#include "driver/ledc.h"

/**
 * @brief Operating modes for the L298N / L829 Dual H-Bridge motor driver
 */
enum class MotorControlMode {
    /**
     * @brief 3-wire control per motor (ENA/ENB PWM + IN1..IN4 digital GPIO direction).
     * Recommended for standard L298N boards when jumpers on ENA/ENB are removed.
     */
    PwmEnablePins,

    /**
     * @brief 2-wire control per motor (ENA/ENB jumpered to 5V; PWM applied directly to IN1..IN4).
     * Saves 2 GPIO pins by keeping factory jumpers on ENA and ENB.
     */
    PwmDirectPins
};

/**
 * @brief Complete configuration parameters for L298N / L829 Motor Driver
 */
struct MotorDriverConfig {
    // Motor A (Left Motor) Pins
    gpio_num_t in1Pin = GPIO_NUM_15;       ///< Motor A Control Pin 1 (Direct PWM in 4-wire mode)
    gpio_num_t in2Pin = GPIO_NUM_16;       ///< Motor A Control Pin 2 (Direct PWM in 4-wire mode)
    gpio_num_t enaPin = GPIO_NUM_NC;       ///< Optional Speed Enable PWM (set to GPIO_NUM_NC to exclude, keeping 5V jumper)

    // Motor B (Right Motor) Pins
    gpio_num_t in3Pin = GPIO_NUM_18;       ///< Motor B Control Pin 1 (Direct PWM in 4-wire mode)
    gpio_num_t in4Pin = GPIO_NUM_17;       ///< Motor B Control Pin 2 (Direct PWM in 4-wire mode)
    gpio_num_t enbPin = GPIO_NUM_NC;       ///< Optional Speed Enable PWM (set to GPIO_NUM_NC to exclude, keeping 5V jumper)

    // Control Mode: Defaults to 4-wire direct PWM (ENA/ENB excluded with 5V jumpers installed)
    MotorControlMode mode = MotorControlMode::PwmDirectPins;

    // Motor Inversion Flags (accounts for physically mirrored mounting)
    bool invertLeft = false;               ///< Invert left motor polarity
    bool invertRight = true;               ///< Invert right motor polarity (accounts for mirrored right-side motors)

    // ESP32-S3 Hardware LEDC PWM Parameters
    ledc_timer_t ledcTimer = LEDC_TIMER_1;              ///< Timer 1 (Timer 0 reserved for LCD backlight)
    ledc_mode_t speedMode = LEDC_LOW_SPEED_MODE;        ///< Low speed mode supported on ESP32-S3
    ledc_channel_t pwmChannelA = LEDC_CHANNEL_1;        ///< LEDC Channel for IN1 (or ENA)
    ledc_channel_t pwmChannelA2 = LEDC_CHANNEL_2;       ///< LEDC Channel for IN2
    ledc_channel_t pwmChannelB = LEDC_CHANNEL_3;        ///< LEDC Channel for IN3 (or ENB)
    ledc_channel_t pwmChannelB2 = LEDC_CHANNEL_4;       ///< LEDC Channel for IN4

    uint32_t pwmFreqHz = 20000;                         ///< 20 kHz ultrasonic PWM (silent, eliminates acoustic motor whine)
    ledc_timer_bit_t pwmResolution = LEDC_TIMER_10_BIT; ///< 10-bit resolution (0 - 1023 duty steps)

    // Motion Dynamics & Safety
    float minSpeed = 0.15f;                ///< Deadzone threshold (real DC motors don't spin below ~15% duty)
    float maxSpeed = 1.00f;                ///< Maximum speed clamp (1.0 = 100%)
    float slewRate = 3.0f;                 ///< Acceleration ramp rate in units/sec (3.0 = 0 to 100% in 0.33s)
    bool enableRamping = true;             ///< Smooth soft-start to prevent battery/rail brownouts
};

/**
 * @brief Live telemetry snapshot of motor state
 */
struct MotorTelemetry {
    float targetLeft = 0.0f;     ///< Commanded target left motor speed [-1.0 .. 1.0]
    float targetRight = 0.0f;    ///< Commanded target right motor speed [-1.0 .. 1.0]
    float currentLeft = 0.0f;    ///< Actual smoothed left motor speed [-1.0 .. 1.0]
    float currentRight = 0.0f;   ///< Actual smoothed right motor speed [-1.0 .. 1.0]
    float throttle = 0.0f;       ///< Commanded longitudinal throttle [-1.0 .. 1.0]
    float steering = 0.0f;       ///< Commanded rotational steering [-1.0 .. 1.0]
    bool isBraking = false;      ///< True if active electrical brake is engaged on either motor
    bool isBrakingLeft = false;  ///< True if active electrical brake is engaged on Left motor (Motor B)
    bool isBrakingRight = false; ///< True if active electrical brake is engaged on Right motor (Motor A)
    bool isMoving = false;       ///< True if motors are actively driving
};

/**
 * @brief High-performance dual H-bridge motor driver for L298N / L829 modules on ESP32-S3.
 *
 * Features:
 * - Full hardware PWM control using ESP32-S3 LEDC peripheral (silent 20kHz switching)
 * - 3-wire (ENA/ENB PWM) and 2-wire direct PWM operating modes
 * - Differential drive (skid-steering) kinematics: arcade drive, turn, spin, reverse
 * - Soft-start / slew-rate acceleration limiting to prevent MCU brownout resets
 * - Deadzone compensation for physical DC gearmotors
 * - Active electrical braking (short brake) vs low-power coasting
 * - Full thread-safe status telemetry
 */
class MotorDriver {
public:
    MotorDriver();
    explicit MotorDriver(const MotorDriverConfig& config);
    ~MotorDriver();

    /**
     * @brief Initialize GPIOs and hardware LEDC PWM timers/channels
     * @return esp_err_t ESP_OK on success, or ESP error code
     */
    esp_err_t init();

    /**
     * @brief Reconfigure driver with a new configuration
     * @param config New configuration parameters
     * @return esp_err_t ESP_OK on success
     */
    esp_err_t setConfig(const MotorDriverConfig& config);

    /**
     * @brief Get active configuration
     */
    const MotorDriverConfig& getConfig() const { return config; }

    /**
     * @brief Periodic update function for slew-rate acceleration ramping
     * @param dt Elapsed time in seconds since last update
     */
    void update(float dt);

    /**
     * @brief Arcade / differential drive kinematics control
     * @param throttle Forward/reverse speed in range [-1.0 .. 1.0]
     * @param steering Turn/spin rate in range [-1.0 .. 1.0] (-1 = full left, +1 = full right)
     */
    void drive(float throttle, float steering);

    /**
     * @brief Command independent left and right motor speeds
     * @param leftSpeed Left motor speed [-1.0 .. 1.0]
     * @param rightSpeed Right motor speed [-1.0 .. 1.0]
     */
    void setMotorSpeeds(float leftSpeed, float rightSpeed);

    /**
     * @brief Command Motor A (Left) directly
     * @param speed Speed [-1.0 .. 1.0] (positive = forward, negative = reverse, 0 = stop)
     */
    void setMotorA(float speed);

    /**
     * @brief Command Motor B (Right) directly
     * @param speed Speed [-1.0 .. 1.0] (positive = forward, negative = reverse, 0 = stop)
     */
    void setMotorB(float speed);

    // High-Level Motion Primitives
    void forward(float speed = 1.0f);
    void backward(float speed = 1.0f);
    void turnLeft(float speed = 1.0f, float turnRatio = 0.5f);
    void turnRight(float speed = 1.0f, float turnRatio = 0.5f);
    void spinLeft(float speed = 1.0f);
    void spinRight(float speed = 1.0f);

    /**
     * @brief Stop both motors
     * @param brake If true, engages active dynamic braking (H-bridge low sides closed);
     *              if false, allows motors to coast freely to a stop.
     */
    void stop(bool brake = false);

    /**
     * @brief Active electrical brake for Motor A (Left)
     */
    void brakeMotorA();

    /**
     * @brief Active electrical brake for Motor B (Right)
     */
    void brakeMotorB();

    /**
     * @brief Low-power free-wheeling coast for Motor A (Left)
     */
    void coastMotorA();

    /**
     * @brief Low-power free-wheeling coast for Motor B (Right)
     */
    void coastMotorB();

    /**
     * @brief Set acceleration slew rate
     * @param rate Slew rate in units/sec (0 to disable ramping)
     */
    void setSlewRate(float rate) {
        config.slewRate = rate;
        config.enableRamping = (rate > 0.0f);
    }

    /**
     * @brief Set minimum deadzone speed
     */
    void setMinSpeed(float minSpeed) { config.minSpeed = std::max(0.0f, std::min(minSpeed, 0.9f)); }

    /**
     * @brief Set motor inversion flags
     */
    void setInverted(bool invertLeft, bool invertRight) {
        config.invertLeft = invertLeft;
        config.invertRight = invertRight;
    }

    // Diagnostics & Hardware Self-Test
    /**
     * @brief Run an automated sequential diagnostic test on both motors
     * @param stepDurationMs Duration for each active motion phase in ms
     * @param speed Target test speed (0.15 .. 1.0)
     */
    void runDiagnosticTest(uint32_t stepDurationMs = 1500, float speed = 0.40f);

    // Telemetry & Status Queries
    const MotorTelemetry& getTelemetry() const { return telemetry; }
    bool isMoving() const { return telemetry.isMoving; }
    bool isBraking() const { return telemetry.isBraking; }
    bool isInitialized() const { return initialized; }

private:
    MotorDriverConfig config;
    MotorTelemetry telemetry;
    bool initialized = false;
    uint32_t maxPwmDuty = 1023; // Computed from pwmResolution

    void configureGpio();
    void configurePwm();
    void applyHardwareOutputs(float leftSpeed, float rightSpeed);
    void applyMotorHBridge(gpio_num_t in1, gpio_num_t in2, ledc_channel_t pwmChan,
                           ledc_channel_t pwmChan2, float speed, bool inverted, bool isBraking);
    float applyDeadzone(float normalizedSpeed);
};

// Aliases for compatibility with alternative naming conventions
using L298NDriver = MotorDriver;
using L829MotorDriver = MotorDriver;
using L829Driver = MotorDriver;

/**
 * @brief Global default MotorDriver instance accessor
 */
MotorDriver& getMotorDriver();
