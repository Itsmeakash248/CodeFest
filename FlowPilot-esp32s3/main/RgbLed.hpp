#pragma once

#include <cstdint>
#include "esp_err.h"
#include "driver/gpio.h"
#include "led_strip.h"

// Forward declaration of RobotFace and RobotEmotion to allow loose coupling
class RobotFace;
enum class RobotEmotion;

/**
 * @brief Operational and animation modes for the onboard RGB LED
 */
enum class RgbLedMode {
    Off,            ///< LED turned off
    Solid,          ///< Static solid color
    Breathing,      ///< Smooth sinusoidal breathing / pulsing
    Rainbow,        ///< Smooth continuous rainbow color cycle
    Blink,          ///< Periodic blinking / strobing
    EmotionSync     ///< Dynamically synchronized with RobotFace emotion and breath cycle
};

/**
 * @brief Controller for the onboard WS2812 addressable RGB LED (GPIO 48 on ESP32-S3)
 */
class RgbLed {
public:
    /// Default GPIO for ESP32-S3 DevKit onboard WS2812 RGB LED
    static constexpr gpio_num_t DEFAULT_GPIO_PIN = GPIO_NUM_48;

    /// Safety limit: Maximum allowed brightness strictly capped to 20% (51 / 255 = 20.0%)
    static constexpr uint8_t MAX_BRIGHTNESS_LIMIT = 51;

    /// Default comfortable brightness (0-255)
    static constexpr uint8_t DEFAULT_BRIGHTNESS = 51;

    RgbLed();
    ~RgbLed();

    /**
     * @brief Initialize the WS2812 LED strip on the specified GPIO pin
     * @param pin GPIO pin connected to the LED data line (defaults to GPIO 48)
     * @return esp_err_t ESP_OK on success, or error code on failure
     */
    esp_err_t init(gpio_num_t pin = DEFAULT_GPIO_PIN);

    /**
     * @brief Periodic update function for animations and smooth transitions
     * @param dt Delta time in seconds since the last frame
     */
    void update(float dt);

    /**
     * @brief Set the operational mode
     * @param mode Selected RgbLedMode
     */
    void setMode(RgbLedMode mode);
    RgbLedMode getMode() const { return currentMode; }

    /**
     * @brief Set direct RGB color (0-255 each)
     */
    void setRgb(uint8_t r, uint8_t g, uint8_t b);

    /**
     * @brief Set color from 16-bit RGB565 format (used by LovyanGFX and RobotFace)
     */
    void setColor565(uint16_t color565);

    /**
     * @brief Set color via HSV color space
     * @param hue Hue angle (0 - 360 degrees)
     * @param sat Saturation (0 - 255)
     * @param val Value / Brightness (0 - 255)
     */
    void setHsv(uint16_t hue, uint8_t sat, uint8_t val);

    /**
     * @brief Set global maximum brightness scaling factor (strictly capped to 20% / MAX_BRIGHTNESS_LIMIT)
     * @param brightness Brightness value (0 = off, max capped at MAX_BRIGHTNESS_LIMIT = 51)
     */
    void setBrightness(uint8_t brightness);

    /**
     * @brief Set global brightness by percentage (0.0% to 100.0%, clamped to 20.0%)
     * @param percent Brightness percentage (clamped to max 20.0%)
     */
    void setBrightnessPercent(float percent);

    uint8_t getBrightness() const { return maxBrightness; }
    float getBrightnessPercent() const { return ((float)maxBrightness / 255.0f) * 100.0f; }
    static constexpr uint8_t getMaxBrightnessLimit() { return MAX_BRIGHTNESS_LIMIT; }

    /**
     * @brief Turn off the LED and clear internal colors
     */
    void clear();

    /**
     * @brief Set breathing speed for Breathing mode
     * @param speedHz Frequency in Hz (e.g. 0.5Hz = 2 second breathing cycle)
     */
    void setBreathingSpeed(float speedHz) { breathingSpeed = speedHz; }

    /**
     * @brief Synchronize the LED directly with an active RobotFace instance
     *        Extracts current emotion, theme colors, and breath phase.
     * @param face Reference to the active RobotFace instance
     */
    void syncWithFace(const RobotFace& face);

    /**
     * @brief Manually synchronize with a specific RobotEmotion
     * @param emotion Target emotion
     * @param immediate If true, jump immediately without crossfading
     */
    void syncEmotion(RobotEmotion emotion, bool immediate = false);

    /**
     * @brief Utility: Convert 16-bit RGB565 to 8-bit RGB components
     */
    static inline void rgb565To888(uint16_t c565, uint8_t& r, uint8_t& g, uint8_t& b) {
        r = ((c565 >> 11) & 0x1F) * 255 / 31;
        g = ((c565 >> 5)  & 0x3F) * 255 / 63;
        b = ( c565        & 0x1F) * 255 / 31;
    }

    /**
     * @brief Utility: Convert HSV to 8-bit RGB components
     */
    static void hsv2rgb(uint16_t h, uint8_t s, uint8_t v, uint8_t& r, uint8_t& g, uint8_t& b);

private:
    led_strip_handle_t ledStripHandle;
    bool isInitialized;
    gpio_num_t gpioPin;

    RgbLedMode currentMode;
    uint8_t maxBrightness;

    // Active color components
    uint8_t activeR, activeG, activeB;
    // Target color components for crossfades
    uint8_t targetR, targetG, targetB;

    // Animation variables
    float animTime;
    float breathingSpeed;
    float blinkTimer;
    bool blinkState;
    float crossfadeProgress;

    // Synchronized RobotFace state cache
    uint8_t emotionR, emotionG, emotionB;
    float faceBreathPhase;
    int cachedEmotionInt;

    void applyHardwareColor(uint8_t r, uint8_t g, uint8_t b);
    void getEmotionBaseColor(RobotEmotion emotion, uint8_t& r, uint8_t& g, uint8_t& b);
};
