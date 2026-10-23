#pragma once

#include "esp_err.h"
#include <cstdint>

/**
 * @brief Phases of the comprehensive dual motor hardware test
 */
enum class MotorTestPhase {
    Idle,
    Countdown,
    MotorA_Forward,   ///< Left Motor (Motor A) Forward Test
    MotorA_Coast,     ///< Left Motor Coasting Test
    MotorA_Reverse,   ///< Left Motor (Motor A) Reverse Test
    MotorA_Brake,     ///< Left Motor Active Dynamic Brake Test
    MotorB_Forward,   ///< Right Motor (Motor B) Forward Test
    MotorB_Coast,     ///< Right Motor Coasting Test
    MotorB_Reverse,   ///< Right Motor (Motor B) Reverse Test
    MotorB_Brake,     ///< Right Motor Active Dynamic Brake Test
    Dual_Forward,     ///< Synchronized Straight Forward Drive Test
    Dual_Brake1,      ///< Dual Active Dynamic Brake Test
    Dual_Reverse,     ///< Synchronized Straight Reverse Drive Test
    Dual_Brake2,      ///< Dual Active Dynamic Brake Test
    Turn_Left,        ///< Forward Left Arc Turn Test
    Turn_Right,       ///< Forward Right Arc Turn Test
    Spin_Left,        ///< In-Place Counter-Clockwise Skid-Steer Spin Test
    Spin_Right,       ///< In-Place Clockwise Skid-Steer Spin Test
    Ramp_Test,        ///< Slew-Rate Acceleration Ramp & Soft-Start Test
    Cycle_Rest,       ///< Rest pause between test cycles
    Complete
};

/**
 * @brief Configuration parameters for the motor test routine
 */
struct MotorTestConfig {
    bool continuousLoop = true;          ///< If true, loops test indefinitely; if false, runs once
    float testSpeed = 0.40f;             ///< Nominal test speed (0.15 .. 1.0)
    uint32_t countdownSec = 3;           ///< Safety countdown duration in seconds
    uint32_t stepDurationMs = 1500;      ///< Duration in ms for each motion test step
    uint32_t pauseDurationMs = 800;      ///< Duration in ms for pauses between steps
    uint32_t cycleRestDurationMs = 4000; ///< Duration in ms to rest between cycles
};

/**
 * @brief Start the FreeRTOS motor test task on Core 0
 * @param config Optional custom test configuration
 * @return esp_err_t ESP_OK on success
 */
esp_err_t startMotorTestTask(const MotorTestConfig& config = MotorTestConfig{});

/**
 * @brief Stop the motor test task and immediately halt both motors
 */
void stopMotorTestTask();

/**
 * @brief Check if the motor test task is currently active
 */
bool isMotorTestRunning();

/**
 * @brief Get human-readable name of current test phase
 */
const char* getMotorTestPhaseName();

/**
 * @brief Get current test phase enum
 */
MotorTestPhase getMotorTestPhase();
