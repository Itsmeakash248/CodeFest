#pragma once

#include <cstdint>
#include "esp_timer.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_heap_caps.h"

/**
 * @brief High-precision Performance & Telemetry Monitor for ESP32-S3 Dual-Core FreeRTOS
 *
 * Tracks:
 *  - Rendering Frame Rate (Instantaneous & Smoothed Rolling FPS)
 *  - Real-time CPU Usage (Total, Core 0, Core 1) via FreeRTOS Idle Task run-time stats
 *  - System Memory (Free Heap, Min Free Heap, PSRAM)
 */
class PerfMonitor {
public:
    static PerfMonitor& getInstance() {
        static PerfMonitor instance;
        return instance;
    }

    void init();
    void update(float dt);

    // Call on every rendered frame to feed the FPS calculation
    void onFrameRendered();

    // Getters for performance metrics (Core 1 & Core 2 separate telemetry)
    float getFps() const { return smoothedFps; }
    float getCpuCore1() const { return smoothedCpu0; } // Core 1 (ESP32 Core 0)
    float getCpuCore2() const { return smoothedCpu1; } // Core 2 (ESP32 Core 1)
    float getCpuTotal() const { return smoothedCpuTotal; }
    float getCpu0() const { return smoothedCpu0; }
    float getCpu1() const { return smoothedCpu1; }
    uint32_t getFreeHeap() const { return freeHeapBytes; }
    uint32_t getFreePsram() const { return freePsramBytes; }

private:
    PerfMonitor();
    ~PerfMonitor() = default;
    PerfMonitor(const PerfMonitor&) = delete;
    PerfMonitor& operator=(const PerfMonitor&) = delete;

    // FreeRTOS Idle Task handles
    TaskHandle_t idleHandle0;
    TaskHandle_t idleHandle1;

    // CPU telemetry state
    int64_t lastCpuSampleTimeUs;
    uint64_t lastIdleTime0;
    uint64_t lastIdleTime1;
    float currentCpu0;
    float currentCpu1;
    float currentCpuTotal;
    float smoothedCpu0;
    float smoothedCpu1;
    float smoothedCpuTotal;

    // FPS telemetry state
    int64_t lastFpsSampleTimeUs;
    uint32_t frameCount;
    float currentFps;
    float smoothedFps;

    // Memory telemetry state
    int64_t lastMemSampleTimeUs;
    uint32_t freeHeapBytes;
    uint32_t freePsramBytes;
};
