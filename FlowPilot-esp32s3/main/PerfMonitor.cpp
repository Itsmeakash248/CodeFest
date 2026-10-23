#include "PerfMonitor.hpp"
#include <algorithm>
#include <esp_log.h>
#include <esp_system.h>

static const char* TAG = "PERF_MONITOR";

PerfMonitor::PerfMonitor()
    : idleHandle0(nullptr)
    , idleHandle1(nullptr)
    , lastCpuSampleTimeUs(0)
    , lastIdleTime0(0)
    , lastIdleTime1(0)
    , currentCpu0(0.0f)
    , currentCpu1(0.0f)
    , currentCpuTotal(0.0f)
    , smoothedCpu0(0.0f)
    , smoothedCpu1(0.0f)
    , smoothedCpuTotal(0.0f)
    , lastFpsSampleTimeUs(0)
    , frameCount(0)
    , currentFps(60.0f)
    , smoothedFps(60.0f)
    , lastMemSampleTimeUs(0)
    , freeHeapBytes(0)
    , freePsramBytes(0)
{
}

void PerfMonitor::init() {
    int64_t now = esp_timer_get_time();
    lastCpuSampleTimeUs = now;
    lastFpsSampleTimeUs = now;
    lastMemSampleTimeUs = now;
    frameCount = 0;

    // Retrieve FreeRTOS idle task handles for both ESP32-S3 cores
    idleHandle0 = xTaskGetIdleTaskHandleForCore(0);
    idleHandle1 = xTaskGetIdleTaskHandleForCore(1);

    if (idleHandle0 != nullptr) {
        TaskStatus_t s0;
        vTaskGetInfo(idleHandle0, &s0, pdFALSE, eInvalid);
        lastIdleTime0 = s0.ulRunTimeCounter;
    }
    if (idleHandle1 != nullptr) {
        TaskStatus_t s1;
        vTaskGetInfo(idleHandle1, &s1, pdFALSE, eInvalid);
        lastIdleTime1 = s1.ulRunTimeCounter;
    }

    freeHeapBytes = esp_get_free_heap_size();
    freePsramBytes = heap_caps_get_free_size(MALLOC_CAP_SPIRAM);

    ESP_LOGI(TAG, "PerfMonitor initialized (Dual-Core SMP telemetry active). Free Heap: %u B, PSRAM: %u B",
             (unsigned int)freeHeapBytes, (unsigned int)freePsramBytes);
}

void PerfMonitor::onFrameRendered() {
    frameCount++;

    int64_t now = esp_timer_get_time();
    int64_t deltaUs = now - lastFpsSampleTimeUs;

    // Refresh FPS calculation window every ~350ms
    if (deltaUs >= 350000) {
        float rawFps = (float)frameCount / ((float)deltaUs / 1000000.0f);
        if (rawFps > 120.0f) rawFps = 120.0f;
        if (rawFps < 0.0f) rawFps = 0.0f;

        currentFps = rawFps;
        // Smooth exponential moving average for steady visual display
        smoothedFps = (smoothedFps * 0.70f) + (rawFps * 0.30f);

        frameCount = 0;
        lastFpsSampleTimeUs = now;
    }
}

void PerfMonitor::update(float /*dt*/) {
    // Lazy handle resolution if scheduler was just starting during early init
    if (idleHandle0 == nullptr) {
        idleHandle0 = xTaskGetIdleTaskHandleForCore(0);
        if (idleHandle0 != nullptr) {
            TaskStatus_t s0;
            vTaskGetInfo(idleHandle0, &s0, pdFALSE, eInvalid);
            lastIdleTime0 = s0.ulRunTimeCounter;
        }
    }
    if (idleHandle1 == nullptr) {
        idleHandle1 = xTaskGetIdleTaskHandleForCore(1);
        if (idleHandle1 != nullptr) {
            TaskStatus_t s1;
            vTaskGetInfo(idleHandle1, &s1, pdFALSE, eInvalid);
            lastIdleTime1 = s1.ulRunTimeCounter;
        }
    }

    int64_t now = esp_timer_get_time();
    int64_t deltaCpuUs = now - lastCpuSampleTimeUs;

    // Sample CPU load every ~350ms
    if (deltaCpuUs >= 350000) {
        if (idleHandle0 != nullptr && idleHandle1 != nullptr) {
            TaskStatus_t s0, s1;
            vTaskGetInfo(idleHandle0, &s0, pdFALSE, eInvalid);
            vTaskGetInfo(idleHandle1, &s1, pdFALSE, eInvalid);

            uint64_t idle0 = s0.ulRunTimeCounter;
            uint64_t idle1 = s1.ulRunTimeCounter;

            uint64_t dIdle0 = idle0 - lastIdleTime0;
            uint64_t dIdle1 = idle1 - lastIdleTime1;

            float dtSec = (float)deltaCpuUs;
            if (dtSec > 0.0f) {
                float idle0Pct = (float)dIdle0 / dtSec;
                float idle1Pct = (float)dIdle1 / dtSec;

                if (idle0Pct > 1.0f) idle0Pct = 1.0f;
                if (idle0Pct < 0.0f) idle0Pct = 0.0f;
                if (idle1Pct > 1.0f) idle1Pct = 1.0f;
                if (idle1Pct < 0.0f) idle1Pct = 0.0f;

                currentCpu0 = (1.0f - idle0Pct) * 100.0f;
                currentCpu1 = (1.0f - idle1Pct) * 100.0f;
                currentCpuTotal = (currentCpu0 + currentCpu1) * 0.5f;

                // Smooth exponential moving average for steady UI display
                smoothedCpu0 = (smoothedCpu0 * 0.65f) + (currentCpu0 * 0.35f);
                smoothedCpu1 = (smoothedCpu1 * 0.65f) + (currentCpu1 * 0.35f);
                smoothedCpuTotal = (smoothedCpuTotal * 0.65f) + (currentCpuTotal * 0.35f);
            }

            lastIdleTime0 = idle0;
            lastIdleTime1 = idle1;
        }

        lastCpuSampleTimeUs = now;
    }

    // Refresh memory telemetry every 1.5 seconds
    if (now - lastMemSampleTimeUs >= 1500000) {
        freeHeapBytes = esp_get_free_heap_size();
        freePsramBytes = heap_caps_get_free_size(MALLOC_CAP_SPIRAM);
        lastMemSampleTimeUs = now;
    }
}
