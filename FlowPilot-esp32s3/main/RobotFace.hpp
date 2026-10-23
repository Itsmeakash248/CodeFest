#pragma once

#include <cstdint>
#include <cmath>
#include "LGFX_Config.hpp"

/**
 * @brief Robot facial emotional states
 */
enum class RobotEmotion {
    Neutral,     ///< Calm, observant cybernetic companion
    Happy,       //< Joyful arch eyes, glowing blush, bouncy smile waveform
    Curious,     //< Cocked eyebrow, wandering gaze, holographic data ring
    Surprised,   //< Wide round eyes, dilated pupils, alert beacon
    Focused,     //< Determined angled eyes, low sharp brow, scanning reticle
    Sleepy,      //< Heavy drooping eyelids, slow deep breathing, floating "Z"s
    Wink,        //< Playful wink with starburst sparkle
    Sad,         //< Drooping outer lids, low brows, soft melancholy blue
    Rage,        //< Fiery crimson eyes, intense downward slant, fast pulse
    Dasara,      ///< Festive Dasara edition: Chandan/Kumkum tilak, flickering Diya, golden eyes & sparkles
    COUNT
};

/**
 * @brief 16-bit RGB565 Cybernetic Color Palette for each emotion
 */
struct RobotTheme {
    uint16_t primary;     ///< Main vibrant glow color (iris, brows, mouth)
    uint16_t secondary;   ///< Bright highlight / white-hot core
    uint16_t glow;        ///< Soft ambient halo / bloom
    uint16_t accent;      ///< Secondary details (blush, holographic icons)
    uint16_t bg;          ///< Obsidian visor background
};

/**
 * @brief Telemetry overlay display modes
 */
enum class PerfOverlayMode {
    Off,       ///< Overlay hidden
    Compact,   ///< Compact badge: "FPS 30.0 | CPU 24% [==  ]"
    Detailed,  ///< Detailed dual-core badge: "FPS 30.0 | C0: 18% C1: 30% | HEAP 280K"
    Minimal,   ///< Minimalist badge: "30.0 FPS · 24%"
    COUNT
};

/**
 * @brief Telemetry overlay screen placement
 */
enum class PerfOverlayPosition {
    BottomCenter, ///< Centered at bottom (default, fits between Diyas)
    TopCenter,    ///< Centered along top HUD bar
    TopRight,     ///< Docked at top-right
    BottomRight   ///< Docked at bottom-right
};

/**
 * @brief Detailed Animated Robot Face Engine for LovyanGFX
 */
class RobotFace {
public:
    explicit RobotFace(LGFX& display);
    ~RobotFace();

    bool init();
    void update(float dt);
    void render();

    // Emotion controls
    void setEmotion(RobotEmotion emotion, bool immediate = false);
    RobotEmotion getEmotion() const { return currentEmotion; }
    const RobotTheme& getTheme() const { return currentTheme; }
    float getBreathPhase() const { return breathPhase; }
    void nextEmotion();

    // Autonomous behavior control (manual web control can hold a pose/gaze)
    void setAutonomousEnabled(bool enabled) {
        autonomousEnabled = enabled;
        if (enabled) {
            saccadeTimer = 0.0f;
            autoEmotionTimer = 0.0f;
        }
    }
    bool isAutonomousEnabled() const { return autonomousEnabled; }

    // Performance telemetry overlay controls (Core 1 & Core 2 separate telemetry)
    void setPerfStats(float fps, float cpuCore1, float cpuCore2, float cpuTotal = -1.0f, uint32_t freeHeap = 0);
    float getFps() const { return perfFps; }
    float getCpuCore1() const { return perfCpuCore1; }
    float getCpuCore2() const { return perfCpuCore2; }
    float getCpuTotal() const { return perfCpuTotal; }
    void setPerfOverlayMode(PerfOverlayMode mode) { perfMode = mode; }
    PerfOverlayMode getPerfOverlayMode() const { return perfMode; }
    void cyclePerfOverlayMode();
    void setPerfOverlayPosition(PerfOverlayPosition pos) { perfPos = pos; }
    PerfOverlayPosition getPerfOverlayPosition() const { return perfPos; }
    bool isTouchOnOverlay(int32_t x, int32_t y) const;

    // Wi-Fi link indicator (grouped with the top-left HUD info)
    void setWifiStats(bool enabled, bool connected, int8_t rssi);
    bool isWifiEnabled() const { return wifiEnabled; }

    // User interaction
    void handleTouch(int32_t x, int32_t y);
    void releaseTouch();
    void triggerBlink();
    void triggerWink();
    void setLookAt(float normX, float normY); // -1.0f to 1.0f

private:
    LGFX& display;
    LGFX_Sprite canvas;
    bool canvasReady;

    // Emotions
    RobotEmotion currentEmotion;
    RobotEmotion targetEmotion;

    // Interpolated Color Theme
    RobotTheme currentTheme;
    RobotTheme targetTheme;
    float themeTransition;

    // Display constants
    static constexpr int32_t SCREEN_WIDTH = 320;
    static constexpr int32_t SCREEN_HEIGHT = 240;

    static constexpr float EYE_CENTER_LEFT_X  = 100.0f;
    static constexpr float EYE_CENTER_RIGHT_X = 220.0f;
    static constexpr float EYE_NOMINAL_Y      = 108.0f;
    static constexpr float EYE_BASE_WIDTH     = 70.0f;
    static constexpr float EYE_BASE_HEIGHT    = 82.0f;
    static constexpr float EYE_BASE_RADIUS    = 24.0f;

    // Kinematics & Physical Parameters
    float gazeX, targetGazeX;             // -26.0 to +26.0 px
    float gazeY, targetGazeY;             // -20.0 to +20.0 px
    float eyeWidth, targetEyeWidth;
    float eyeHeight, targetEyeHeight;
    float eyeRadius, targetEyeRadius;

    // Eyelid Parameters
    float upperLidOpen, targetUpperLidOpen; // 0.0 (closed) to 1.0 (fully open)
    float lowerLidOpen, targetLowerLidOpen; // 0.0 (squinted) to 1.0 (open)
    float lidAngle, targetLidAngle;         // Eyelid tilt in radians

    // Eyebrows
    float leftBrowY, targetLeftBrowY;
    float rightBrowY, targetRightBrowY;
    float leftBrowAngle, targetLeftBrowAngle;
    float rightBrowAngle, targetRightBrowAngle;

    // Blinking State Machine
    enum class BlinkPhase { Idle, Closing, Closed, Opening };
    BlinkPhase blinkPhase;
    float blinkTimer;
    float blinkProgress;
    float nextBlinkInterval;
    bool isDoubleBlink;
    bool isWinking;

    // Autonomous Lifelike Behavior
    float saccadeTimer;
    float nextSaccadeInterval;
    float autoEmotionTimer;
    float nextAutoEmotionInterval;
    float touchReleaseTimer;
    bool isUserTouching;
    bool isBeingPetted;
    bool autonomousEnabled;

    // Micro-motion & Ambient Waves
    float globalTime;
    float breathPhase;
    float bounceOffset;
    float voicePhase;
    float voiceHeights[9];
    float blushIntensity, targetBlushIntensity;

    // Internal update methods
    void updateAutonomousAI(float dt);
    void updateBlinking(float dt);
    void updateTheme(float dt);
    void updateKinematics(float dt);
    void applyEmotionPreset(RobotEmotion emotion);

    // Drawing methods
    void drawBackground();
    void drawVisorHUD();
    void drawEye(float cx, float cy, bool isLeft, float upperOpen, float lowerOpen, float slant);
    void drawHappyEye(float cx, float cy, bool isLeft);
    void drawWinkEye(float cx, float cy, bool isLeft);
    void drawEyebrow(float cx, float cy, float angle, float length);
    void drawMouth();
    void drawCheekBlush();
    void drawHolographicAccents();

    // Dasara festive drawing methods
    void drawFestiveTilak(float cx, float cy);
    void drawDiya(float x, float y, float scale, float flamePhase);
    void drawFestiveSparkles();

    // Performance Telemetry Overlay (Core 1 & Core 2 separate telemetry)
    float perfFps;
    float perfCpuCore1;
    float perfCpuCore2;
    float perfCpuTotal;
    uint32_t perfFreeHeap;
    PerfOverlayMode perfMode;
    PerfOverlayPosition perfPos;
    int32_t overlayX;
    int32_t overlayY;
    int32_t overlayW;
    int32_t overlayH;
    void drawPerfOverlay();

    // Wi-Fi link indicator
    bool wifiEnabled;
    bool wifiConnected;
    int8_t wifiRssi;
    void drawWifiIndicator(int32_t x, int32_t y);

    // Color helpers
    static RobotTheme getEmotionTheme(RobotEmotion emotion);
    static uint16_t blendColor(uint16_t c1, uint16_t c2, float t);
};
