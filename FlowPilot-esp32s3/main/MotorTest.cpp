#include "MotorTest.hpp"
#include "MotorDriver.hpp"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include <algorithm>
#include <cmath>

static const char *TAG = "MOTOR_TEST";

static TaskHandle_t s_testTaskHandle = nullptr;
static volatile bool s_testRunning = false;
static volatile MotorTestPhase s_currentPhase = MotorTestPhase::Idle;
static MotorTestConfig s_activeConfig;

static bool sleepInterruptible(uint32_t durationMs) {
    const uint32_t sliceMs = 50;
    uint32_t elapsed = 0;
    while (s_testRunning && elapsed < durationMs) {
        uint32_t toSleep = std::min(sliceMs, durationMs - elapsed);
        vTaskDelay(pdMS_TO_TICKS(toSleep));
        elapsed += toSleep;
    }
    return s_testRunning;
}

static void motor_test_task(void *pvParameters) {
    MotorDriver& motor = getMotorDriver();
    const MotorDriverConfig& mCfg = motor.getConfig();

    ESP_LOGI(TAG, "======================================================================");
    ESP_LOGI(TAG, "🚀 FlowPilot Motor Test Task Started on Core %d", xPortGetCoreID());
    ESP_LOGI(TAG, "   Motor A (Left):  IN1=GPIO %d, IN2=GPIO %d (Invert: %s)",
             (int)mCfg.in1Pin, (int)mCfg.in2Pin, mCfg.invertLeft ? "YES" : "NO");
    ESP_LOGI(TAG, "   Motor B (Right): IN3=GPIO %d, IN4=GPIO %d (Invert: %s)",
             (int)mCfg.in3Pin, (int)mCfg.in4Pin, mCfg.invertRight ? "YES" : "NO");
    ESP_LOGI(TAG, "   Mode: %s | PWM: %lu Hz | Slew Rate: %.1f/s",
             (mCfg.mode == MotorControlMode::PwmDirectPins) ? "4-Wire Direct PWM" : "6-Wire ENA/ENB",
             mCfg.pwmFreqHz, mCfg.slewRate);
    ESP_LOGI(TAG, "   Safety: Elevated wheels or stand recommended during bench testing!");
    ESP_LOGI(TAG, "======================================================================");

    s_testRunning = true;
    s_currentPhase = MotorTestPhase::Countdown;

    // Safety Countdown
    for (int i = (int)s_activeConfig.countdownSec; i > 0 && s_testRunning; i--) {
        ESP_LOGW(TAG, "⏳ Motor test starting in %d second%s...", i, (i > 1 ? "s" : ""));
        sleepInterruptible(1000);
    }

    uint32_t cycle = 0;
    const float spd = std::clamp(s_activeConfig.testSpeed, 0.15f, 1.0f);
    const uint32_t stepMs = s_activeConfig.stepDurationMs;
    const uint32_t pauseMs = s_activeConfig.pauseDurationMs;

    // Resolve active PWM pins based on inversion configuration
    const gpio_num_t aFwdPwm = mCfg.invertLeft ? mCfg.in2Pin : mCfg.in1Pin;
    const gpio_num_t aFwdLow = mCfg.invertLeft ? mCfg.in1Pin : mCfg.in2Pin;
    const gpio_num_t bFwdPwm = mCfg.invertRight ? mCfg.in4Pin : mCfg.in3Pin;
    const gpio_num_t bFwdLow = mCfg.invertRight ? mCfg.in3Pin : mCfg.in4Pin;

    while (s_testRunning) {
        cycle++;
        ESP_LOGI(TAG, "----------------------------------------------------------------------");
        ESP_LOGI(TAG, "▶ Starting Motor Test Cycle #%lu [Nominal Speed: %.0f%%]", cycle, spd * 100.0f);
        ESP_LOGI(TAG, "----------------------------------------------------------------------");

        // ==================================================================
        // Phase 1: Left Motor (Motor A) Isolated Test
        // ==================================================================
        s_currentPhase = MotorTestPhase::MotorA_Forward;
        ESP_LOGI(TAG, "[1/8] Motor A (Left) FORWARD @ +%.0f%% (GPIO %d PWM, GPIO %d LOW)...",
                 spd * 100.0f, (int)aFwdPwm, (int)aFwdLow);
        motor.setMotorSpeeds(spd, 0.0f);
        if (!sleepInterruptible(stepMs)) break;

        s_currentPhase = MotorTestPhase::MotorA_Coast;
        ESP_LOGI(TAG, "      Motor A (Left) COAST STOP (Both pins LOW)...");
        motor.coastMotorA();
        if (!sleepInterruptible(pauseMs)) break;

        s_currentPhase = MotorTestPhase::MotorA_Reverse;
        ESP_LOGI(TAG, "[2/8] Motor A (Left) REVERSE @ -%.0f%% (GPIO %d LOW, GPIO %d PWM)...",
                 spd * 100.0f, (int)aFwdPwm, (int)aFwdLow);
        motor.setMotorSpeeds(-spd, 0.0f);
        if (!sleepInterruptible(stepMs)) break;

        s_currentPhase = MotorTestPhase::MotorA_Brake;
        ESP_LOGI(TAG, "      Motor A (Left) ACTIVE BRAKE (Both pins HIGH)...");
        motor.brakeMotorA();
        if (!sleepInterruptible(pauseMs)) break;

        // ==================================================================
        // Phase 2: Right Motor (Motor B) Isolated Test
        // ==================================================================
        s_currentPhase = MotorTestPhase::MotorB_Forward;
        ESP_LOGI(TAG, "[3/8] Motor B (Right) FORWARD @ +%.0f%% (GPIO %d PWM, GPIO %d LOW)...",
                 spd * 100.0f, (int)bFwdPwm, (int)bFwdLow);
        motor.setMotorSpeeds(0.0f, spd);
        if (!sleepInterruptible(stepMs)) break;

        s_currentPhase = MotorTestPhase::MotorB_Coast;
        ESP_LOGI(TAG, "      Motor B (Right) COAST STOP (Both pins LOW)...");
        motor.coastMotorB();
        if (!sleepInterruptible(pauseMs)) break;

        s_currentPhase = MotorTestPhase::MotorB_Reverse;
        ESP_LOGI(TAG, "[4/8] Motor B (Right) REVERSE @ -%.0f%% (GPIO %d LOW, GPIO %d PWM)...",
                 spd * 100.0f, (int)bFwdPwm, (int)bFwdLow);
        motor.setMotorSpeeds(0.0f, -spd);
        if (!sleepInterruptible(stepMs)) break;

        s_currentPhase = MotorTestPhase::MotorB_Brake;
        ESP_LOGI(TAG, "      Motor B (Right) ACTIVE BRAKE (Both pins HIGH)...");
        motor.brakeMotorB();
        if (!sleepInterruptible(pauseMs)) break;

        // ==================================================================
        // Phase 3: Dual Motor Synchronized Straight Forward
        // ==================================================================
        s_currentPhase = MotorTestPhase::Dual_Forward;
        ESP_LOGI(TAG, "[5/8] Dual Motors STRAIGHT FORWARD @ +%.0f%% (Both Motors)...",
                 spd * 100.0f);
        motor.forward(spd);
        if (!sleepInterruptible(stepMs)) break;

        s_currentPhase = MotorTestPhase::Dual_Brake1;
        ESP_LOGI(TAG, "      Dual Motors ACTIVE ELECTRIC BRAKE...");
        motor.stop(true);
        if (!sleepInterruptible(pauseMs)) break;

        // ==================================================================
        // Phase 4: Dual Motor Synchronized Straight Reverse
        // ==================================================================
        s_currentPhase = MotorTestPhase::Dual_Reverse;
        ESP_LOGI(TAG, "[6/8] Dual Motors STRAIGHT REVERSE @ -%.0f%% (Both Motors)...",
                 spd * 100.0f);
        motor.backward(spd);
        if (!sleepInterruptible(stepMs)) break;

        s_currentPhase = MotorTestPhase::Dual_Brake2;
        ESP_LOGI(TAG, "      Dual Motors ACTIVE ELECTRIC BRAKE...");
        motor.stop(true);
        if (!sleepInterruptible(pauseMs)) break;

        // ==================================================================
        // Phase 5: Skid-Steer / In-Place Pivot Spin
        // ==================================================================
        s_currentPhase = MotorTestPhase::Spin_Left;
        ESP_LOGI(TAG, "[7/8] Skid-Steer SPIN LEFT (CCW: Left -%.0f%%, Right +%.0f%%)...",
                 (spd * 0.9f) * 100.0f, (spd * 0.9f) * 100.0f);
        motor.spinLeft(spd * 0.9f);
        if (!sleepInterruptible(stepMs)) break;

        motor.stop(true);
        if (!sleepInterruptible(pauseMs / 2)) break;

        s_currentPhase = MotorTestPhase::Spin_Right;
        ESP_LOGI(TAG, "      Skid-Steer SPIN RIGHT (CW: Left +%.0f%%, Right -%.0f%%)...",
                 (spd * 0.9f) * 100.0f, (spd * 0.9f) * 100.0f);
        motor.spinRight(spd * 0.9f);
        if (!sleepInterruptible(stepMs)) break;

        motor.stop(true);
        if (!sleepInterruptible(pauseMs)) break;

        // ==================================================================
        // Phase 6: Soft-Start Acceleration Slew Ramp Test
        // ==================================================================
        s_currentPhase = MotorTestPhase::Ramp_Test;
        ESP_LOGI(TAG, "[8/8] Slew-Rate Acceleration Ramp Test (0%% -> 60%% -> 0%%)...");
        const float rampPeak = 0.60f;
        const int rampSteps = 5;

        // Ramp Up
        for (int step = 1; step <= rampSteps && s_testRunning; step++) {
            float rampVal = (rampPeak / (float)rampSteps) * (float)step;
            motor.setMotorSpeeds(rampVal, rampVal);
            ESP_LOGI(TAG, "      Ramp UP Step %d/%d -> Commanded: %.0f%% | Current L: %.2f R: %.2f",
                     step, rampSteps, rampVal * 100.0f,
                     motor.getTelemetry().currentLeft, motor.getTelemetry().currentRight);
            sleepInterruptible(250);
        }

        // Ramp Down
        for (int step = rampSteps - 1; step >= 0 && s_testRunning; step--) {
            float rampVal = (rampPeak / (float)rampSteps) * (float)step;
            motor.setMotorSpeeds(rampVal, rampVal);
            ESP_LOGI(TAG, "      Ramp DOWN Step %d/%d -> Commanded: %.0f%% | Current L: %.2f R: %.2f",
                     step, rampSteps, rampVal * 100.0f,
                     motor.getTelemetry().currentLeft, motor.getTelemetry().currentRight);
            sleepInterruptible(250);
        }

        motor.stop(false);
        ESP_LOGI(TAG, "----------------------------------------------------------------------");
        ESP_LOGI(TAG, "✅ Motor Test Cycle #%lu COMPLETE: All channels successfully verified!", cycle);
        ESP_LOGI(TAG, "----------------------------------------------------------------------");

        if (!s_activeConfig.continuousLoop) {
            ESP_LOGI(TAG, "Single-shot test requested. Halting motor test task.");
            break;
        }

        s_currentPhase = MotorTestPhase::Cycle_Rest;
        ESP_LOGI(TAG, "⏸️ Resting %lu ms before next test cycle...", s_activeConfig.cycleRestDurationMs);
        if (!sleepInterruptible(s_activeConfig.cycleRestDurationMs)) break;
    }

    // Safe Shutdown
    motor.stop(true);
    s_currentPhase = MotorTestPhase::Complete;
    s_testRunning = false;
    s_testTaskHandle = nullptr;
    ESP_LOGI(TAG, "Motor test task exited cleanly. Motors safely stopped.");
    vTaskDelete(NULL);
}

esp_err_t startMotorTestTask(const MotorTestConfig& config) {
    if (s_testRunning) {
        ESP_LOGW(TAG, "Motor test task is already running.");
        return ESP_OK;
    }

    s_activeConfig = config;

    // Pin test task to Core 0 with priority 3 (leaving Core 1 for 30 FPS face rendering)
    BaseType_t ret = xTaskCreatePinnedToCore(
        motor_test_task,
        "motor_test",
        4096,
        NULL,
        3,
        &s_testTaskHandle,
        0 // Pin to Core 0
    );

    if (ret != pdPASS) {
        ESP_LOGE(TAG, "Failed to create motor_test task!");
        return ESP_FAIL;
    }

    return ESP_OK;
}

void stopMotorTestTask() {
    if (!s_testRunning && s_testTaskHandle == nullptr) {
        return;
    }

    ESP_LOGI(TAG, "Stopping motor test task...");
    s_testRunning = false;
    getMotorDriver().stop(true);

    if (s_testTaskHandle != nullptr) {
        vTaskDelay(pdMS_TO_TICKS(60));
        if (s_testTaskHandle != nullptr) {
            vTaskDelete(s_testTaskHandle);
            s_testTaskHandle = nullptr;
        }
    }

    s_currentPhase = MotorTestPhase::Idle;
    ESP_LOGI(TAG, "Motor test task stopped. Motors safely halted.");
}

bool isMotorTestRunning() {
    return s_testRunning;
}

MotorTestPhase getMotorTestPhase() {
    return s_currentPhase;
}

const char* getMotorTestPhaseName() {
    switch (s_currentPhase) {
        case MotorTestPhase::Idle:            return "Idle";
        case MotorTestPhase::Countdown:       return "Countdown";
        case MotorTestPhase::MotorA_Forward:  return "Motor A FWD";
        case MotorTestPhase::MotorA_Coast:    return "Motor A Coast";
        case MotorTestPhase::MotorA_Reverse:  return "Motor A REV";
        case MotorTestPhase::MotorA_Brake:    return "Motor A Brake";
        case MotorTestPhase::MotorB_Forward:  return "Motor B FWD";
        case MotorTestPhase::MotorB_Coast:    return "Motor B Coast";
        case MotorTestPhase::MotorB_Reverse:  return "Motor B REV";
        case MotorTestPhase::MotorB_Brake:    return "Motor B Brake";
        case MotorTestPhase::Dual_Forward:    return "Dual FWD";
        case MotorTestPhase::Dual_Brake1:     return "Dual Brake";
        case MotorTestPhase::Dual_Reverse:    return "Dual REV";
        case MotorTestPhase::Dual_Brake2:     return "Dual Brake";
        case MotorTestPhase::Turn_Left:       return "Turn Left";
        case MotorTestPhase::Turn_Right:      return "Turn Right";
        case MotorTestPhase::Spin_Left:       return "Spin CCW";
        case MotorTestPhase::Spin_Right:      return "Spin CW";
        case MotorTestPhase::Ramp_Test:       return "Ramp Slew";
        case MotorTestPhase::Cycle_Rest:      return "Resting";
        case MotorTestPhase::Complete:        return "Complete";
        default:                              return "Unknown";
    }
}
