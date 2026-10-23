#include "RgbLed.hpp"
#include "RobotFace.hpp"
#include <esp_log.h>
#include <cmath>
#include <algorithm>

static const char* TAG = "RGB_LED";

#ifndef M_PI
#define M_PI 3.14159265358979323846f
#endif

RgbLed::RgbLed()
    : ledStripHandle(nullptr)
    , isInitialized(false)
    , gpioPin(DEFAULT_GPIO_PIN)
    , currentMode(RgbLedMode::EmotionSync)
    , maxBrightness(std::min(DEFAULT_BRIGHTNESS, MAX_BRIGHTNESS_LIMIT))
    , activeR(0), activeG(212), activeB(255)       // Default Cyber Cyan
    , targetR(0), targetG(212), targetB(255)
    , animTime(0.0f)
    , breathingSpeed(0.5f)                          // 0.5 Hz = 2.0s per breath
    , blinkTimer(0.0f)
    , blinkState(true)
    , crossfadeProgress(1.0f)
    , emotionR(0), emotionG(212), emotionB(255)
    , faceBreathPhase(0.0f)
    , cachedEmotionInt(-1)
{
}

RgbLed::~RgbLed() {
    clear();
    if (ledStripHandle) {
        led_strip_del(ledStripHandle);
        ledStripHandle = nullptr;
    }
}

esp_err_t RgbLed::init(gpio_num_t pin) {
    gpioPin = pin;

    led_strip_config_t strip_config = {
        .strip_gpio_num = pin,
        .max_leds = 1,
        .led_model = LED_MODEL_WS2812,
        .color_component_format = LED_STRIP_COLOR_COMPONENT_FMT_GRB,
        .timings = {},
        .flags = {
            .invert_out = false,
        }
    };

    led_strip_rmt_config_t rmt_config = {
        .clk_src = RMT_CLK_SRC_DEFAULT,
        .resolution_hz = 10 * 1000 * 1000, // 10MHz resolution for precise WS2812 timing
        .mem_block_symbols = 64,
        .flags = {
            .with_dma = false,
        }
    };

    esp_err_t ret = led_strip_new_rmt_device(&strip_config, &rmt_config, &ledStripHandle);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to create RMT device for WS2812 on GPIO %d: %s", pin, esp_err_to_name(ret));
        return ret;
    }

    isInitialized = true;
    clear();

    ESP_LOGI(TAG, "Built-in WS2812 RGB LED initialized successfully on GPIO %d (Brightness: %u/255, Limit: %u/255 [20%%])",
             pin, maxBrightness, MAX_BRIGHTNESS_LIMIT);
    return ESP_OK;
}

void RgbLed::setMode(RgbLedMode mode) {
    currentMode = mode;
    animTime = 0.0f;
    blinkTimer = 0.0f;
    blinkState = true;
    if (mode == RgbLedMode::Off) {
        clear();
    }
}

void RgbLed::setRgb(uint8_t r, uint8_t g, uint8_t b) {
    targetR = r;
    targetG = g;
    targetB = b;
    activeR = r;
    activeG = g;
    activeB = b;
    if (currentMode == RgbLedMode::Solid) {
        applyHardwareColor(activeR, activeG, activeB);
    }
}

void RgbLed::setColor565(uint16_t color565) {
    uint8_t r, g, b;
    rgb565To888(color565, r, g, b);
    setRgb(r, g, b);
}

void RgbLed::setHsv(uint16_t hue, uint8_t sat, uint8_t val) {
    uint8_t r, g, b;
    hsv2rgb(hue, sat, val, r, g, b);
    setRgb(r, g, b);
}

void RgbLed::setBrightness(uint8_t brightness) {
    if (brightness > MAX_BRIGHTNESS_LIMIT) {
        ESP_LOGW(TAG, "Requested brightness %u exceeds safety limit of %u (20%% max). Clamping.",
                 brightness, MAX_BRIGHTNESS_LIMIT);
        brightness = MAX_BRIGHTNESS_LIMIT;
    }
    maxBrightness = brightness;
}

void RgbLed::setBrightnessPercent(float percent) {
    if (percent < 0.0f) {
        percent = 0.0f;
    }
    const float maxPercent = ((float)MAX_BRIGHTNESS_LIMIT / 255.0f) * 100.0f; // 20.0% limit
    if (percent > maxPercent) {
        ESP_LOGW(TAG, "Requested brightness %.1f%% exceeds safety limit of %.1f%% (20%% max). Clamping.",
                 percent, maxPercent);
        percent = maxPercent;
    }
    setBrightness((uint8_t)std::round((percent / 100.0f) * 255.0f));
}

void RgbLed::clear() {
    if (!isInitialized || !ledStripHandle) return;
    led_strip_clear(ledStripHandle);
}

void RgbLed::applyHardwareColor(uint8_t r, uint8_t g, uint8_t b) {
    if (!isInitialized || !ledStripHandle) return;

    // Ensure effective brightness is strictly clamped to 20% (max 51/255)
    uint8_t effectiveBrightness = std::min(maxBrightness, MAX_BRIGHTNESS_LIMIT);

    // Apply global brightness scaling
    uint32_t finalR = ((uint32_t)r * effectiveBrightness) / 255;
    uint32_t finalG = ((uint32_t)g * effectiveBrightness) / 255;
    uint32_t finalB = ((uint32_t)b * effectiveBrightness) / 255;

    // Defense-in-depth: guarantee each channel never exceeds the under-50% threshold
    finalR = std::min<uint32_t>(finalR, MAX_BRIGHTNESS_LIMIT);
    finalG = std::min<uint32_t>(finalG, MAX_BRIGHTNESS_LIMIT);
    finalB = std::min<uint32_t>(finalB, MAX_BRIGHTNESS_LIMIT);

    led_strip_set_pixel(ledStripHandle, 0, finalR, finalG, finalB);
    led_strip_refresh(ledStripHandle);
}

void RgbLed::getEmotionBaseColor(RobotEmotion emotion, uint8_t& r, uint8_t& g, uint8_t& b) {
    switch (emotion) {
        case RobotEmotion::Happy:
            r = 0;   g = 245; b = 102; // Cyber Emerald Green
            break;
        case RobotEmotion::Curious:
            r = 85;  g = 206; b = 255; // Electric Azure Cyan
            break;
        case RobotEmotion::Surprised:
            r = 255; g = 215; b = 0;   // High-voltage Cyber Gold
            break;
        case RobotEmotion::Focused:
            r = 0;   g = 250; b = 234; // Electric Cyan-Teal
            break;
        case RobotEmotion::Sleepy:
            r = 155; g = 123; b = 255; // Dreamy Soft Lavender
            break;
        case RobotEmotion::Wink:
            r = 255; g = 255; b = 255; // Pure Radiant White Starburst
            break;
        case RobotEmotion::Sad:
            r = 58;  g = 130; b = 255; // Melancholy Ice Cobalt Blue
            break;
        case RobotEmotion::Rage:
            r = 255; g = 26;  b = 26;  // Fiery Crimson Red
            break;
        case RobotEmotion::Dasara:
            r = 255; g = 130; b = 0;   // Royal Festive Saffron / Marigold Gold
            break;
        case RobotEmotion::Neutral:
        default:
            r = 0;   g = 212; b = 255; // Signature Cyber Cyan
            break;
    }
}

void RgbLed::syncEmotion(RobotEmotion emotion, bool immediate) {
    getEmotionBaseColor(emotion, emotionR, emotionG, emotionB);
    cachedEmotionInt = (int)emotion;
    if (immediate) {
        activeR = emotionR;
        activeG = emotionG;
        activeB = emotionB;
        targetR = emotionR;
        targetG = emotionG;
        targetB = emotionB;
    }
}

void RgbLed::syncWithFace(const RobotFace& face) {
    RobotEmotion emo = face.getEmotion();
    faceBreathPhase = face.getBreathPhase();

    // Use currentTheme directly if available for buttery smooth crossfades
    const RobotTheme& theme = face.getTheme();
    rgb565To888(theme.primary, emotionR, emotionG, emotionB);

    if (cachedEmotionInt != (int)emo) {
        cachedEmotionInt = (int)emo;
        if (emo == RobotEmotion::Wink) {
            blinkTimer = 0.0f; // Reset wink sparkle timer
        }
    }
}

void RgbLed::update(float dt) {
    if (!isInitialized || !ledStripHandle) return;

    animTime += dt;

    switch (currentMode) {
        case RgbLedMode::Off:
            clear();
            break;

        case RgbLedMode::Solid:
            applyHardwareColor(activeR, activeG, activeB);
            break;

        case RgbLedMode::Breathing: {
            float phase = animTime * breathingSpeed * 2.0f * (float)M_PI;
            float breath = (std::sin(phase) + 1.0f) * 0.5f; // 0.0 to 1.0
            float intensity = 0.12f + 0.88f * breath;       // Subtle minimum glow
            applyHardwareColor(
                (uint8_t)(activeR * intensity),
                (uint8_t)(activeG * intensity),
                (uint8_t)(activeB * intensity)
            );
            break;
        }

        case RgbLedMode::Rainbow: {
            float hue = std::fmod(animTime * 60.0f, 360.0f);
            uint8_t r, g, b;
            hsv2rgb((uint16_t)hue, 255, 255, r, g, b);
            applyHardwareColor(r, g, b);
            break;
        }

        case RgbLedMode::Blink: {
            blinkTimer += dt;
            if (blinkTimer >= 0.5f) {
                blinkTimer = 0.0f;
                blinkState = !blinkState;
            }
            if (blinkState) {
                applyHardwareColor(activeR, activeG, activeB);
            } else {
                clear();
            }
            break;
        }

        case RgbLedMode::EmotionSync: {
            // Smoothly converge active color to emotion color
            float blendSpeed = 8.0f; // Fast, responsive color tracking
            float alpha = 1.0f - std::exp(-blendSpeed * dt);
            activeR = (uint8_t)(activeR + (emotionR - activeR) * alpha);
            activeG = (uint8_t)(activeG + (emotionG - activeG) * alpha);
            activeB = (uint8_t)(activeB + (emotionB - activeB) * alpha);

            float intensity = 1.0f;
            RobotEmotion emo = (RobotEmotion)cachedEmotionInt;

            switch (emo) {
                case RobotEmotion::Rage: {
                    // Rapid aggressive heartbeat pulse (3.5 Hz)
                    float beat = std::sin(animTime * 22.0f);
                    intensity = 0.30f + 0.70f * std::max(0.0f, beat * beat);
                    break;
                }
                case RobotEmotion::Sleepy: {
                    // Deep slow breathing cycle with low dim baseline
                    float breath = (std::sin(faceBreathPhase * 0.6f) + 1.0f) * 0.5f;
                    intensity = 0.08f + 0.32f * breath;
                    break;
                }
                case RobotEmotion::Wink: {
                    // Quick playful starburst sparkle
                    blinkTimer += dt;
                    if (blinkTimer < 0.28f) {
                        applyHardwareColor(255, 255, 255); // Flash blinding starburst
                        return;
                    }
                    intensity = 0.85f;
                    break;
                }
                case RobotEmotion::Surprised: {
                    // Energetic alert pulse (2.5 Hz)
                    float pulse = (std::sin(animTime * 15.0f) + 1.0f) * 0.5f;
                    intensity = 0.35f + 0.65f * pulse;
                    break;
                }
                case RobotEmotion::Focused: {
                    // Steady beam with high-tech micro-shimmer
                    intensity = 0.85f + 0.15f * std::sin(animTime * 10.0f);
                    break;
                }
                case RobotEmotion::Happy: {
                    // Uplifting rhythmic pulse
                    float pulse = (std::sin(faceBreathPhase * 1.5f) + 1.0f) * 0.5f;
                    intensity = 0.25f + 0.75f * pulse;
                    break;
                }
                case RobotEmotion::Dasara: {
                    // Authentic Diya (oil lamp) flame flicker: warm golden breath + natural flame flicker modulation
                    float breath = (std::sin(faceBreathPhase * 1.2f) + 1.0f) * 0.5f;
                    float flicker = 0.82f + 0.12f * std::sin(animTime * 14.5f) + 0.06f * std::cos(animTime * 23.3f);
                    intensity = (0.35f + 0.65f * breath) * flicker;
                    intensity = std::clamp(intensity, 0.20f, 1.0f);
                    break;
                }
                case RobotEmotion::Curious:
                case RobotEmotion::Sad:
                case RobotEmotion::Neutral:
                default: {
                    // Organic breathing directly synced with robot face breath cycle
                    float breath = (std::sin(faceBreathPhase) + 1.0f) * 0.5f;
                    intensity = 0.18f + 0.82f * breath;
                    break;
                }
            }

            applyHardwareColor(
                (uint8_t)(activeR * intensity),
                (uint8_t)(activeG * intensity),
                (uint8_t)(activeB * intensity)
            );
            break;
        }
    }
}

void RgbLed::hsv2rgb(uint16_t h, uint8_t s, uint8_t v, uint8_t& r, uint8_t& g, uint8_t& b) {
    if (s == 0) {
        r = g = b = v;
        return;
    }

    h %= 360;
    uint8_t region = h / 60;
    uint32_t remainder = (h - (region * 60)) * 6;

    uint32_t p = ((uint32_t)v * (255 - s)) >> 8;
    uint32_t q = ((uint32_t)v * (255 - (((uint32_t)s * remainder) >> 8))) >> 8;
    uint32_t t = ((uint32_t)v * (255 - (((uint32_t)s * (255 - remainder)) >> 8))) >> 8;

    switch (region) {
        case 0:  r = v; g = (uint8_t)t; b = (uint8_t)p; break;
        case 1:  r = (uint8_t)q; g = v; b = (uint8_t)p; break;
        case 2:  r = (uint8_t)p; g = v; b = (uint8_t)t; break;
        case 3:  r = (uint8_t)p; g = (uint8_t)q; b = v; break;
        case 4:  r = (uint8_t)t; g = (uint8_t)p; b = v; break;
        default: r = v; g = (uint8_t)p; b = (uint8_t)q; break;
    }
}
