#include "RobotFace.hpp"
#include <esp_log.h>
#include <esp_memory_utils.h>
#include <algorithm>
#include <cstdlib>

static const char* TAG = "ROBOT_FACE";

#ifndef M_PI
#define M_PI 3.14159265358979323846f
#endif

// Helper: blend two RGB565 colors
uint16_t RobotFace::blendColor(uint16_t c1, uint16_t c2, float t) {
    if (t <= 0.0f) return c1;
    if (t >= 1.0f) return c2;

    uint32_t r1 = (c1 >> 11) & 0x1F;
    uint32_t g1 = (c1 >> 5) & 0x3F;
    uint32_t b1 = c1 & 0x1F;

    uint32_t r2 = (c2 >> 11) & 0x1F;
    uint32_t g2 = (c2 >> 5) & 0x3F;
    uint32_t b2 = c2 & 0x1F;

    uint32_t r = (uint32_t)(r1 + (r2 - r1) * t);
    uint32_t g = (uint32_t)(g1 + (g2 - g1) * t);
    uint32_t b = (uint32_t)(b1 + (b2 - b1) * t);

    return (uint16_t)((r << 11) | (g << 5) | b);
}

// Preset color themes for emotions
RobotTheme RobotFace::getEmotionTheme(RobotEmotion emotion) {
    // Visor obsidian background: 0x0842 (RGB: 8, 8, 16)
    constexpr uint16_t BG = 0x0842;

    switch (emotion) {
        case RobotEmotion::Happy:
            // Cyber Emerald & Coral Blush
            return {
                .primary   = 0x07EC, // Neon Emerald Green
                .secondary = 0xE7FF, // Crisp Mint White
                .glow      = 0x0284, // Deep Emerald Bloom
                .accent    = 0xF9EF, // Coral Pink
                .bg        = BG
            };
        case RobotEmotion::Curious:
            // Electric Sky Azure & Amber
            return {
                .primary   = 0x567F, // Azure Cyan
                .secondary = 0xFFFF, // Pure White
                .glow      = 0x1292, // Deep Azure
                .accent    = 0xFDE0, // Golden Amber
                .bg        = BG
            };
        case RobotEmotion::Surprised:
            // High-voltage Cyber Gold / Yellow
            return {
                .primary   = 0xFFE0, // Vivid Yellow
                .secondary = 0xFFFF, // Pure White
                .glow      = 0x6300, // Amber Glow
                .accent    = 0xFFFF, // Laser White
                .bg        = BG
            };
        case RobotEmotion::Focused:
            // Laser Cyan & Ruby Reticle
            return {
                .primary   = 0x07FD, // Electric Cyan-Teal
                .secondary = 0xFFFF, // Crisp White
                .glow      = 0x024E, // Deep Teal
                .accent    = 0xF800, // Targeting Ruby
                .bg        = BG
            };
        case RobotEmotion::Sleepy:
            // Dreamy Lavender & Soft Cyan
            return {
                .primary   = 0x9BDF, // Soft Lavender
                .secondary = 0xDEFB, // Pale Lilac
                .glow      = 0x28B0, // Deep Violet
                .accent    = 0x5EBF, // Dream Cyan
                .bg        = BG
            };
        case RobotEmotion::Wink:
            // Playful Cyan & Radiant Starburst
            return {
                .primary   = 0x077F, // Neon Cyan
                .secondary = 0xFFFF, // Pure White
                .glow      = 0x0210, // Cyan Glow
                .accent    = 0xFFE0, // Radiant Gold Star
                .bg        = BG
            };
        case RobotEmotion::Sad:
            // Deep Ice Cobalt & Melancholy Navy
            return {
                .primary   = 0x3C1F, // Cobalt Blue
                .secondary = 0x9E7F, // Ice Blue
                .glow      = 0x0989, // Deep Navy
                .accent    = 0x5EBF, // Pale Aqua
                .bg        = BG
            };
        case RobotEmotion::Rage:
            // Fiery Crimson & Overheat Orange
            return {
                .primary   = 0xFA00, // Fiery Red
                .secondary = 0xFFFF, // Blinding White
                .glow      = 0x4800, // Dark Crimson
                .accent    = 0xFDE0, // Overheat Amber
                .bg        = BG
            };
        case RobotEmotion::Dasara:
            // Royal Festive Saffron, Marigold Gold & Kumkum Vermilion
            return {
                .primary   = 0xFE20, // Radiant Saffron / Marigold Gold (RGB: 254, 196, 0)
                .secondary = 0xFFFF, // Luminous Warm White Core
                .glow      = 0xA280, // Deep Amber-Saffron Bloom
                .accent    = 0xF800, // Auspicious Kumkum Crimson Red
                .bg        = BG
            };
        case RobotEmotion::Neutral:
        default:
            // Signature Cyber Cyan Companion
            return {
                .primary   = 0x077F, // Electric Cyan
                .secondary = 0xFFFF, // Pure White
                .glow      = 0x0210, // Dark Cyan Bloom
                .accent    = 0x3FF7, // Neon Teal
                .bg        = BG
            };
    }
}

RobotFace::RobotFace(LGFX& disp)
    : display(disp)
    , canvas(&disp)
    , canvasReady(false)
    , currentEmotion(RobotEmotion::Dasara)
    , targetEmotion(RobotEmotion::Dasara)
    , themeTransition(1.0f)
    , gazeX(0.0f), targetGazeX(0.0f)
    , gazeY(0.0f), targetGazeY(0.0f)
    , eyeWidth(EYE_BASE_WIDTH), targetEyeWidth(EYE_BASE_WIDTH)
    , eyeHeight(EYE_BASE_HEIGHT), targetEyeHeight(EYE_BASE_HEIGHT)
    , eyeRadius(EYE_BASE_RADIUS), targetEyeRadius(EYE_BASE_RADIUS)
    , upperLidOpen(1.0f), targetUpperLidOpen(1.0f)
    , lowerLidOpen(1.0f), targetLowerLidOpen(1.0f)
    , lidAngle(0.0f), targetLidAngle(0.0f)
    , leftBrowY(52.0f), targetLeftBrowY(52.0f)
    , rightBrowY(52.0f), targetRightBrowY(52.0f)
    , leftBrowAngle(0.0f), targetLeftBrowAngle(0.0f)
    , rightBrowAngle(0.0f), targetRightBrowAngle(0.0f)
    , blinkPhase(BlinkPhase::Idle)
    , blinkTimer(0.0f)
    , blinkProgress(0.0f)
    , nextBlinkInterval(3.5f)
    , isDoubleBlink(false)
    , isWinking(false)
    , saccadeTimer(0.0f)
    , nextSaccadeInterval(2.5f)
    , autoEmotionTimer(0.0f)
    , nextAutoEmotionInterval(12.0f)
    , touchReleaseTimer(0.0f)
    , isUserTouching(false)
    , isBeingPetted(false)
    , autonomousEnabled(true)
    , globalTime(0.0f)
    , breathPhase(0.0f)
    , bounceOffset(0.0f)
    , voicePhase(0.0f)
    , blushIntensity(0.0f), targetBlushIntensity(0.0f)
    , perfFps(60.0f)
    , perfCpuCore1(0.0f)
    , perfCpuCore2(0.0f)
    , perfCpuTotal(0.0f)
    , perfFreeHeap(0)
    , perfMode(PerfOverlayMode::Compact)
    , perfPos(PerfOverlayPosition::BottomCenter)
    , overlayX(0)
    , overlayY(0)
    , overlayW(0)
    , overlayH(0)
    , wifiEnabled(false)
    , wifiConnected(false)
    , wifiRssi(0)
{
    currentTheme = getEmotionTheme(RobotEmotion::Dasara);
    targetTheme = currentTheme;
    for (int i = 0; i < 9; ++i) {
        voiceHeights[i] = 10.0f;
    }
}

RobotFace::~RobotFace() {
    if (canvasReady) {
        canvas.deleteSprite();
    }
}

bool RobotFace::init() {
    ESP_LOGI(TAG, "Allocating 16-bit sprite in internal SRAM for high-speed DMA (320x240 RGB565)...");
    canvas.setPsram(false);
    canvas.setColorDepth(16);
    void* buf = canvas.createSprite(SCREEN_WIDTH, SCREEN_HEIGHT);
    if (!buf) {
        ESP_LOGW(TAG, "Internal SRAM allocation failed, falling back to PSRAM...");
        canvas.setPsram(true);
        buf = canvas.createSprite(SCREEN_WIDTH, SCREEN_HEIGHT);
    }

    if (!buf) {
        ESP_LOGE(TAG, "Failed to allocate 320x240 sprite buffer!");
        canvasReady = false;
        return false;
    }

    canvasReady = true;
    ESP_LOGI(TAG, "Sprite initialized successfully (%u bytes, %s).",
             (unsigned)canvas.bufferLength(),
             esp_ptr_internal(buf) ? "Internal SRAM / DMA Enabled" : "PSRAM");

    // Apply festive Dasara preset immediately on boot
    setEmotion(RobotEmotion::Dasara, true);

    return true;
}

void RobotFace::applyEmotionPreset(RobotEmotion emotion) {
    targetTheme = getEmotionTheme(emotion);
    themeTransition = 0.0f;

    switch (emotion) {
        case RobotEmotion::Happy:
            targetEyeWidth         = EYE_BASE_WIDTH * 0.95f;
            targetEyeHeight        = EYE_BASE_HEIGHT * 0.85f;
            targetEyeRadius        = EYE_BASE_RADIUS;
            targetUpperLidOpen     = 1.0f;
            targetLowerLidOpen     = 1.0f;
            targetLidAngle         = 0.0f;
            targetLeftBrowY        = 42.0f;
            targetRightBrowY       = 42.0f;
            targetLeftBrowAngle    = -0.10f;
            targetRightBrowAngle   = 0.10f;
            targetBlushIntensity   = 1.0f;
            isWinking              = false;
            break;

        case RobotEmotion::Curious:
            targetEyeWidth         = EYE_BASE_WIDTH;
            targetEyeHeight        = EYE_BASE_HEIGHT * 1.05f;
            targetEyeRadius        = EYE_BASE_RADIUS;
            targetUpperLidOpen     = 0.95f;
            targetLowerLidOpen     = 0.95f;
            targetLidAngle         = 0.12f;
            // Cocked right eyebrow, slightly furrowed left
            targetLeftBrowY        = 56.0f;
            targetRightBrowY       = 36.0f;
            targetLeftBrowAngle    = -0.15f;
            targetRightBrowAngle   = 0.28f;
            targetBlushIntensity   = 0.0f;
            targetGazeX            = 14.0f;
            targetGazeY            = -10.0f;
            isWinking              = false;
            break;

        case RobotEmotion::Surprised:
            targetEyeWidth         = EYE_BASE_WIDTH * 1.15f;
            targetEyeHeight        = EYE_BASE_HEIGHT * 1.20f;
            targetEyeRadius        = EYE_BASE_RADIUS * 1.25f;
            targetUpperLidOpen     = 1.0f;
            targetLowerLidOpen     = 1.0f;
            targetLidAngle         = 0.0f;
            targetLeftBrowY        = 34.0f;
            targetRightBrowY       = 34.0f;
            targetLeftBrowAngle    = 0.0f;
            targetRightBrowAngle   = 0.0f;
            targetBlushIntensity   = 0.0f;
            isWinking              = false;
            break;

        case RobotEmotion::Focused:
            targetEyeWidth         = EYE_BASE_WIDTH * 1.05f;
            targetEyeHeight        = EYE_BASE_HEIGHT * 0.82f;
            targetEyeRadius        = EYE_BASE_RADIUS * 0.85f;
            targetUpperLidOpen     = 0.78f;
            targetLowerLidOpen     = 0.90f;
            targetLidAngle         = 0.26f; // Fierce inward slant
            targetLeftBrowY        = 58.0f;
            targetRightBrowY       = 58.0f;
            targetLeftBrowAngle    = 0.26f;
            targetRightBrowAngle   = -0.26f;
            targetBlushIntensity   = 0.0f;
            isWinking              = false;
            break;

        case RobotEmotion::Sleepy:
            targetEyeWidth         = EYE_BASE_WIDTH * 0.95f;
            targetEyeHeight        = EYE_BASE_HEIGHT * 0.70f;
            targetEyeRadius        = EYE_BASE_RADIUS;
            targetUpperLidOpen     = 0.32f; // Heavy drooping lid
            targetLowerLidOpen     = 0.85f;
            targetLidAngle         = -0.05f;
            targetLeftBrowY        = 58.0f;
            targetRightBrowY       = 58.0f;
            targetLeftBrowAngle    = 0.02f;
            targetRightBrowAngle   = -0.02f;
            targetBlushIntensity   = 0.0f;
            targetGazeX            = 0.0f;
            targetGazeY            = 12.0f; // Drooping gaze
            isWinking              = false;
            break;

        case RobotEmotion::Wink:
            targetEyeWidth         = EYE_BASE_WIDTH;
            targetEyeHeight        = EYE_BASE_HEIGHT;
            targetEyeRadius        = EYE_BASE_RADIUS;
            targetUpperLidOpen     = 1.0f;
            targetLowerLidOpen     = 1.0f;
            targetLidAngle         = 0.0f;
            targetLeftBrowY        = 46.0f;
            targetRightBrowY       = 52.0f;
            targetLeftBrowAngle    = -0.08f;
            targetRightBrowAngle   = 0.05f;
            targetBlushIntensity   = 0.85f;
            isWinking              = true;
            break;

        case RobotEmotion::Sad:
            targetEyeWidth         = EYE_BASE_WIDTH * 0.95f;
            targetEyeHeight        = EYE_BASE_HEIGHT * 0.90f;
            targetEyeRadius        = EYE_BASE_RADIUS;
            targetUpperLidOpen     = 0.75f;
            targetLowerLidOpen     = 0.85f;
            targetLidAngle         = -0.20f; // Outward droop
            targetLeftBrowY        = 46.0f;
            targetRightBrowY       = 46.0f;
            targetLeftBrowAngle    = -0.25f; // Raised inner brows
            targetRightBrowAngle   = 0.25f;
            targetBlushIntensity   = 0.0f;
            targetGazeX            = 0.0f;
            targetGazeY            = 8.0f;
            isWinking              = false;
            break;

        case RobotEmotion::Rage:
            targetEyeWidth         = EYE_BASE_WIDTH * 1.10f;
            targetEyeHeight        = EYE_BASE_HEIGHT * 0.78f;
            targetEyeRadius        = EYE_BASE_RADIUS * 0.8f;
            targetUpperLidOpen     = 0.70f;
            targetLowerLidOpen     = 0.95f;
            targetLidAngle         = 0.35f; // Sharp angry inward slant
            targetLeftBrowY        = 60.0f;
            targetRightBrowY       = 60.0f;
            targetLeftBrowAngle    = 0.35f;
            targetRightBrowAngle   = -0.35f;
            targetBlushIntensity   = 0.0f;
            isWinking              = false;
            break;

        case RobotEmotion::Dasara:
            targetEyeWidth         = EYE_BASE_WIDTH * 0.95f;
            targetEyeHeight        = EYE_BASE_HEIGHT * 0.85f;
            targetEyeRadius        = EYE_BASE_RADIUS;
            targetUpperLidOpen     = 1.0f;
            targetLowerLidOpen     = 1.0f;
            targetLidAngle         = 0.0f;
            targetLeftBrowY        = 42.0f;
            targetRightBrowY       = 42.0f;
            targetLeftBrowAngle    = -0.06f;
            targetRightBrowAngle   = 0.06f;
            targetBlushIntensity   = 0.95f;
            targetGazeX            = 0.0f;
            targetGazeY            = 0.0f;
            isWinking              = false;
            break;

        case RobotEmotion::Neutral:
        default:
            targetEyeWidth         = EYE_BASE_WIDTH;
            targetEyeHeight        = EYE_BASE_HEIGHT;
            targetEyeRadius        = EYE_BASE_RADIUS;
            targetUpperLidOpen     = 1.0f;
            targetLowerLidOpen     = 1.0f;
            targetLidAngle         = 0.0f;
            targetLeftBrowY        = 50.0f;
            targetRightBrowY       = 50.0f;
            targetLeftBrowAngle    = 0.0f;
            targetRightBrowAngle   = 0.0f;
            targetBlushIntensity   = 0.0f;
            isWinking              = false;
            break;
    }
}

void RobotFace::setEmotion(RobotEmotion emotion, bool immediate) {
    targetEmotion = emotion;
    applyEmotionPreset(emotion);

    if (immediate) {
        currentEmotion       = emotion;
        currentTheme         = targetTheme;
        themeTransition      = 1.0f;
        eyeWidth             = targetEyeWidth;
        eyeHeight            = targetEyeHeight;
        eyeRadius            = targetEyeRadius;
        upperLidOpen         = targetUpperLidOpen;
        lowerLidOpen         = targetLowerLidOpen;
        lidAngle             = targetLidAngle;
        leftBrowY            = targetLeftBrowY;
        rightBrowY           = targetRightBrowY;
        leftBrowAngle        = targetLeftBrowAngle;
        rightBrowAngle       = targetRightBrowAngle;
        blushIntensity       = targetBlushIntensity;
    }
}

void RobotFace::nextEmotion() {
    int next = ((int)currentEmotion + 1) % (int)RobotEmotion::COUNT;
    setEmotion((RobotEmotion)next, false);
}

void RobotFace::setLookAt(float normX, float normY) {
    targetGazeX = std::max(-26.0f, std::min(26.0f, normX * 26.0f));
    targetGazeY = std::max(-20.0f, std::min(20.0f, normY * 20.0f));
}

void RobotFace::handleTouch(int32_t x, int32_t y) {
    isUserTouching = true;
    touchReleaseTimer = 1.6f; // Stay engaged for 1.6s after touch

    // Map screen coordinate (0..319, 0..239) to normalized gaze (-1.0 to 1.0)
    float nx = (float)(x - SCREEN_WIDTH / 2) / (float)(SCREEN_WIDTH / 2);
    float ny = (float)(y - SCREEN_HEIGHT / 2) / (float)(SCREEN_HEIGHT / 2);
    setLookAt(nx, ny);

    // Forehead petting region: top center area (y < 70, 90 <= x <= 230)
    if (y < 70 && x >= 90 && x <= 230) {
        if (!isBeingPetted) {
            isBeingPetted = true;
            setEmotion(RobotEmotion::Happy, false);
        }
    }
}

void RobotFace::releaseTouch() {
    isUserTouching = false;
    isBeingPetted = false;
}

void RobotFace::triggerBlink() {
    if (blinkPhase == BlinkPhase::Idle) {
        blinkPhase = BlinkPhase::Closing;
        blinkProgress = 0.0f;
        isDoubleBlink = (rand() % 4 == 0); // 25% double-blink chance
    }
}

void RobotFace::triggerWink() {
    setEmotion(RobotEmotion::Wink, false);
}

void RobotFace::updateBlinking(float dt) {
    if (isWinking) {
        return; // Wink holds eyelid state separately
    }

    switch (blinkPhase) {
        case BlinkPhase::Idle:
            blinkTimer += dt;
            if (blinkTimer >= nextBlinkInterval) {
                blinkTimer = 0.0f;
                nextBlinkInterval = 2.8f + (float)(rand() % 35) * 0.1f; // 2.8s to 6.3s
                triggerBlink();
            }
            break;

        case BlinkPhase::Closing:
            blinkProgress += dt / 0.045f; // Rapid close in 45ms
            if (blinkProgress >= 1.0f) {
                blinkProgress = 1.0f;
                blinkPhase = BlinkPhase::Closed;
                blinkTimer = 0.0f;
            }
            break;

        case BlinkPhase::Closed:
            blinkTimer += dt;
            if (blinkTimer >= 0.025f) { // Stay closed for 25ms
                blinkPhase = BlinkPhase::Opening;
                blinkProgress = 0.0f;
            }
            break;

        case BlinkPhase::Opening:
            blinkProgress += dt / 0.085f; // Re-open in 85ms
            if (blinkProgress >= 1.0f) {
                blinkProgress = 1.0f;
                if (isDoubleBlink) {
                    isDoubleBlink = false;
                    blinkPhase = BlinkPhase::Closing;
                    blinkProgress = 0.2f; // Quick flutter close
                } else {
                    blinkPhase = BlinkPhase::Idle;
                    blinkTimer = 0.0f;
                }
            }
            break;
    }
}

void RobotFace::updateAutonomousAI(float dt) {
    if (touchReleaseTimer > 0.0f) {
        touchReleaseTimer -= dt;
        if (touchReleaseTimer <= 0.0f) {
            releaseTouch();
            // Return to festive Dasara celebration if it was petted, unless
            // autonomous behavior is disabled for manual control.
            if (autonomousEnabled && currentEmotion == RobotEmotion::Happy) {
                setEmotion(RobotEmotion::Dasara, false);
            }
        }
        return; // User has control, skip autonomous drift
    }

    if (!autonomousEnabled) {
        return; // Web/manual control is holding the expression and gaze
    }

    // Autonomous Saccades (Lifelike gaze shifts)
    saccadeTimer += dt;
    if (saccadeTimer >= nextSaccadeInterval) {
        saccadeTimer = 0.0f;
        nextSaccadeInterval = 1.8f + (float)(rand() % 30) * 0.1f;

        int r = rand() % 100;
        if (r < 45) {
            // Look directly at user
            targetGazeX = 0.0f;
            targetGazeY = 0.0f;
        } else if (r < 65) {
            // Glance left or right
            targetGazeX = (rand() % 2 == 0) ? -18.0f : 18.0f;
            targetGazeY = -2.0f;
        } else if (r < 85) {
            // Thoughtful upward glance
            targetGazeX = (rand() % 2 == 0) ? -14.0f : 14.0f;
            targetGazeY = -12.0f;
        } else {
            // Downward glance
            targetGazeX = 0.0f;
            targetGazeY = 10.0f;
        }
    }

    // Autonomous Emotion Drift (Cycle through behaviors over time)
    autoEmotionTimer += dt;
    if (autoEmotionTimer >= nextAutoEmotionInterval) {
        autoEmotionTimer = 0.0f;
        nextAutoEmotionInterval = 9.0f + (float)(rand() % 60) * 0.1f; // 9s to 15s

        // Sequence of engaging personality states including Happy Dasara
        static const RobotEmotion sequence[] = {
            RobotEmotion::Dasara,
            RobotEmotion::Happy,
            RobotEmotion::Neutral,
            RobotEmotion::Curious,
            RobotEmotion::Dasara,
            RobotEmotion::Focused,
            RobotEmotion::Neutral,
            RobotEmotion::Wink,
            RobotEmotion::Dasara,
            RobotEmotion::Sleepy,
            RobotEmotion::Surprised
        };
        static size_t seqIndex = 0;
        seqIndex = (seqIndex + 1) % (sizeof(sequence) / sizeof(sequence[0]));
        setEmotion(sequence[seqIndex], false);
    }
}

void RobotFace::updateTheme(float dt) {
    if (themeTransition < 1.0f) {
        themeTransition += dt * 3.5f; // Smooth 0.28s color fade
        if (themeTransition > 1.0f) themeTransition = 1.0f;

        currentTheme.primary   = blendColor(currentTheme.primary, targetTheme.primary, themeTransition);
        currentTheme.secondary = blendColor(currentTheme.secondary, targetTheme.secondary, themeTransition);
        currentTheme.glow      = blendColor(currentTheme.glow, targetTheme.glow, themeTransition);
        currentTheme.accent    = blendColor(currentTheme.accent, targetTheme.accent, themeTransition);
        currentTheme.bg        = targetTheme.bg;

        if (themeTransition >= 1.0f) {
            currentTheme = targetTheme;
            currentEmotion = targetEmotion;
        }
    }
}

void RobotFace::updateKinematics(float dt) {
    // Spring-damped exponential easing (frame-rate independent)
    const float posSpeed  = 14.0f;
    const float lidSpeed  = 16.0f;
    const float browSpeed = 12.0f;
    const float sizeSpeed = 10.0f;

    float posAlpha  = 1.0f - expf(-posSpeed * dt);
    float lidAlpha  = 1.0f - expf(-lidSpeed * dt);
    float browAlpha = 1.0f - expf(-browSpeed * dt);
    float sizeAlpha = 1.0f - expf(-sizeSpeed * dt);

    gazeX += (targetGazeX - gazeX) * posAlpha;
    gazeY += (targetGazeY - gazeY) * posAlpha;

    eyeWidth  += (targetEyeWidth - eyeWidth) * sizeAlpha;
    eyeHeight += (targetEyeHeight - eyeHeight) * sizeAlpha;
    eyeRadius += (targetEyeRadius - eyeRadius) * sizeAlpha;

    upperLidOpen += (targetUpperLidOpen - upperLidOpen) * lidAlpha;
    lowerLidOpen += (targetLowerLidOpen - lowerLidOpen) * lidAlpha;
    lidAngle     += (targetLidAngle - lidAngle) * lidAlpha;

    leftBrowY      += (targetLeftBrowY - leftBrowY) * browAlpha;
    rightBrowY     += (targetRightBrowY - rightBrowY) * browAlpha;
    leftBrowAngle  += (targetLeftBrowAngle - leftBrowAngle) * browAlpha;
    rightBrowAngle += (targetRightBrowAngle - rightBrowAngle) * browAlpha;

    blushIntensity += (targetBlushIntensity - blushIntensity) * (1.0f - expf(-8.0f * dt));
}

void RobotFace::update(float dt) {
    globalTime += dt;

    // Organic breathing cycle (~3.5s per breath)
    breathPhase += dt * 1.8f;
    if (breathPhase > 2.0f * M_PI) breathPhase -= 2.0f * M_PI;

    // Cheerful bounce when happy or petted
    if (currentEmotion == RobotEmotion::Happy || isBeingPetted) {
        bounceOffset = fabsf(sinf(globalTime * 9.0f)) * 4.5f;
    } else {
        bounceOffset = 0.0f;
    }

    // Dynamic voice waveform synthesis
    voicePhase += dt * 8.0f;
    for (int i = 0; i < 9; ++i) {
        float harmonic = sinf(voicePhase + (float)i * 0.8f) * cosf(voicePhase * 0.6f + (float)i * 0.4f);
        float baseH = 5.0f + 16.0f * (1.0f - fabsf((float)i - 4.0f) / 5.2f);
        if (currentEmotion == RobotEmotion::Sleepy) baseH *= 0.35f;
        if (currentEmotion == RobotEmotion::Rage) baseH *= 1.35f;
        voiceHeights[i] = baseH + fabsf(harmonic) * (baseH * 0.7f);
    }

    // Run behaviors
    updateAutonomousAI(dt);
    updateBlinking(dt);
    updateTheme(dt);
    updateKinematics(dt);
}

// Render the entire cybernetic robot face
void RobotFace::render() {
    if (!canvasReady) return;

    // 1. Draw visor background with tech brackets
    drawBackground();

    // 2. Draw cybernetic visor HUD
    drawVisorHUD();

    // Compute dynamic offsets
    float breathY = sinf(breathPhase) * 1.6f;
    float effectiveLeftEyeY  = EYE_NOMINAL_Y + gazeY + breathY - bounceOffset;
    float effectiveRightEyeY = EYE_NOMINAL_Y + gazeY + breathY - bounceOffset;
    float effectiveLeftEyeX  = EYE_CENTER_LEFT_X + gazeX;
    float effectiveRightEyeX = EYE_CENTER_RIGHT_X + gazeX;

    // Compute blink factor
    float currentUpperLid = upperLidOpen;
    if (blinkPhase == BlinkPhase::Closing) {
        currentUpperLid = std::min(upperLidOpen, 1.0f - blinkProgress);
    } else if (blinkPhase == BlinkPhase::Closed) {
        currentUpperLid = 0.0f;
    } else if (blinkPhase == BlinkPhase::Opening) {
        currentUpperLid = std::min(upperLidOpen, blinkProgress);
    }

    // 3. Draw Eyes
    if (currentEmotion == RobotEmotion::Happy || currentEmotion == RobotEmotion::Dasara) {
        drawHappyEye(effectiveLeftEyeX, effectiveLeftEyeY, true);
        drawHappyEye(effectiveRightEyeX, effectiveRightEyeY, false);
    } else if (isWinking) {
        drawWinkEye(effectiveLeftEyeX, effectiveLeftEyeY, true);
        drawEye(effectiveRightEyeX, effectiveRightEyeY, false, currentUpperLid, lowerLidOpen, lidAngle);
    } else {
        drawEye(effectiveLeftEyeX, effectiveLeftEyeY, true, currentUpperLid, lowerLidOpen, lidAngle);
        drawEye(effectiveRightEyeX, effectiveRightEyeY, false, currentUpperLid, lowerLidOpen, lidAngle);
    }

    // 4. Draw Eyebrows
    float browBob = sinf(breathPhase) * 0.8f - bounceOffset;
    drawEyebrow(EYE_CENTER_LEFT_X + gazeX * 0.5f, leftBrowY + browBob, leftBrowAngle, 46.0f);
    drawEyebrow(EYE_CENTER_RIGHT_X + gazeX * 0.5f, rightBrowY + browBob, rightBrowAngle, 46.0f);

    // 4b. Draw Auspicious Dasara Chandan & Kumkum Tilak on Forehead
    if (currentEmotion == RobotEmotion::Dasara) {
        drawFestiveTilak(SCREEN_WIDTH / 2.0f + gazeX * 0.35f, 44.0f + browBob);
    }

    // 5. Draw Cheek Blush
    drawCheekBlush();

    // 6. Draw Mouth / Voice Synthesizer
    drawMouth();

    // 7. Draw Holographic Accents (Curious spinner, Alert !, Sleepy Z)
    drawHolographicAccents();

    // 8. Draw Dasara Festive Elements
    if (currentEmotion == RobotEmotion::Dasara) {
        // Floating celebratory golden & vermilion sparkles
        drawFestiveSparkles();

        // Twin auspicious corner Diyas with desynchronized lifelike flickering flames
        drawDiya(34.0f, 214.0f, 0.95f, globalTime * 4.0f);
        drawDiya(286.0f, 214.0f, 0.95f, globalTime * 4.0f + 2.1f);
    }

    // 9. Draw Cybernetic Performance & FPS/CPU Telemetry Overlay
    drawPerfOverlay();

    // Push completed frame to physical screen via high-speed SPI
    canvas.pushSprite(0, 0);
}

void RobotFace::drawBackground() {
    canvas.fillScreen(currentTheme.bg);

    // Subtle Sci-Fi Corner Brackets
    constexpr int32_t B_LEN = 14;
    uint16_t bracketCol = currentTheme.glow;

    // Top-Left ┌
    canvas.drawFastHLine(10, 10, B_LEN, bracketCol);
    canvas.drawFastVLine(10, 10, B_LEN, bracketCol);
    canvas.drawPixel(12, 12, currentTheme.primary);

    // Top-Right ┐
    canvas.drawFastHLine(SCREEN_WIDTH - 10 - B_LEN, 10, B_LEN, bracketCol);
    canvas.drawFastVLine(SCREEN_WIDTH - 11, 10, B_LEN, bracketCol);
    canvas.drawPixel(SCREEN_WIDTH - 13, 12, currentTheme.primary);

    // Bottom-Left └
    canvas.drawFastHLine(10, SCREEN_HEIGHT - 11, B_LEN, bracketCol);
    canvas.drawFastVLine(10, SCREEN_HEIGHT - 10 - B_LEN, B_LEN, bracketCol);
    canvas.drawPixel(12, SCREEN_HEIGHT - 13, currentTheme.primary);

    // Bottom-Right ┘
    canvas.drawFastHLine(SCREEN_WIDTH - 10 - B_LEN, SCREEN_HEIGHT - 11, B_LEN, bracketCol);
    canvas.drawFastVLine(SCREEN_WIDTH - 11, SCREEN_HEIGHT - 10 - B_LEN, B_LEN, bracketCol);
    canvas.drawPixel(SCREEN_WIDTH - 13, SCREEN_HEIGHT - 13, currentTheme.primary);
}

void RobotFace::drawVisorHUD() {
    // 1. Top-Left Battery Indicator
    constexpr int32_t bx = 16, by = 13;
    canvas.drawRoundRect(bx, by, 18, 9, 2, currentTheme.glow);
    canvas.fillRect(bx + 18, by + 2, 2, 5, currentTheme.glow);
    // 3 battery cell bars
    canvas.fillRect(bx + 2, by + 2, 3, 5, currentTheme.accent);
    canvas.fillRect(bx + 7, by + 2, 3, 5, currentTheme.accent);
    canvas.fillRect(bx + 12, by + 2, 3, 5, currentTheme.accent);

    // 2. Status Label
    canvas.setTextSize(1);
    canvas.setTextColor(currentTheme.primary, currentTheme.bg);
    const char* statusStr = "SYS.OK";
    switch (currentEmotion) {
        case RobotEmotion::Happy:     statusStr = "AI.HAPPY";   break;
        case RobotEmotion::Curious:   statusStr = "AI.SCAN";    break;
        case RobotEmotion::Surprised: statusStr = "ALERT!!";    break;
        case RobotEmotion::Focused:   statusStr = "LOCK.ON";    break;
        case RobotEmotion::Sleepy:    statusStr = "SYS.REST";   break;
        case RobotEmotion::Wink:      statusStr = "LINK.SYNC";  break;
        case RobotEmotion::Sad:       statusStr = "DIAG.FAIL";  break;
        case RobotEmotion::Rage:      statusStr = "WARN.HOT";   break;
        case RobotEmotion::Dasara:    statusStr = "HAPPY.DASARA"; break;
        default:                      statusStr = "SYS.ONLINE"; break;
    }
    canvas.drawString(statusStr, bx + 26, by + 1);

    if (currentEmotion == RobotEmotion::Dasara) {
        // Miniature glowing auspicious Diya in top-center HUD
        drawDiya((float)(SCREEN_WIDTH / 2), (float)(by + 3), 0.55f, globalTime * 4.5f);
    }

    // 3. Compact Wi-Fi link indicator, grouped with the battery/status HUD
    int32_t wifiX = bx + 26 + canvas.textWidth(statusStr) + 6;
    if (wifiX > 120) wifiX = 120; // Keep clear of the centred Diya
    drawWifiIndicator(wifiX, by);

    // 4. Top-Right Neural Telemetry ECG Wave
    constexpr int32_t hx = SCREEN_WIDTH - 64, hy = by + 4;
    canvas.drawFastHLine(hx, hy, 8, currentTheme.glow);
    // Animated heartbeat spike
    float pulse = fmodf(globalTime * 3.0f, 1.0f);
    int32_t spike = (pulse < 0.25f) ? (int32_t)(sinf(pulse * 4.0f * M_PI) * 5.0f) : 0;
    canvas.drawLine(hx + 8, hy, hx + 12, hy - spike, currentTheme.primary);
    canvas.drawLine(hx + 12, hy - spike, hx + 16, hy + spike / 2, currentTheme.primary);
    canvas.drawLine(hx + 16, hy + spike / 2, hx + 20, hy, currentTheme.primary);
    canvas.drawFastHLine(hx + 20, hy, 16, currentTheme.glow);

    // Touch feedback beacon
    if (isUserTouching) {
        canvas.fillCircle(SCREEN_WIDTH - 18, by + 4, 3, currentTheme.accent);
    } else {
        canvas.drawCircle(SCREEN_WIDTH - 18, by + 4, 3, currentTheme.glow);
    }
}

void RobotFace::drawEye(float cx, float cy, bool isLeft, float upperOpen, float lowerOpen, float slant) {
    int32_t w = (int32_t)eyeWidth;
    int32_t h = (int32_t)eyeHeight;
    int32_t r = (int32_t)eyeRadius;

    // Completely shut sleep line
    if (upperOpen <= 0.04f && lowerOpen <= 0.04f) {
        canvas.drawWideLine(cx - w / 2, cy, cx + w / 2, cy, 3.5f, currentTheme.primary);
        canvas.drawWideLine(cx - w / 2, cy, cx + w / 2, cy, 1.5f, currentTheme.secondary);
        return;
    }

    // 1. Outer Glow / Halo
    canvas.fillSmoothRoundRect((int32_t)(cx - (w + 8) / 2), (int32_t)(cy - (h + 8) / 2),
                               w + 8, h + 8, r + 3, currentTheme.glow);

    // 2. Main Vibrant Iris Body
    canvas.fillSmoothRoundRect((int32_t)(cx - w / 2), (int32_t)(cy - h / 2),
                               w, h, r, currentTheme.primary);

    // 3. Inner Iris Core Accent (Lighter Rim)
    canvas.drawRoundRect((int32_t)(cx - (w - 10) / 2), (int32_t)(cy - (h - 10) / 2),
                         w - 10, h - 10, std::max<int32_t>(2, r - 4), currentTheme.secondary);

    // 4. Dark Cyber Pupil / Lens Core (moves with parallax)
    float pupilShiftX = gazeX * 0.40f;
    float pupilShiftY = gazeY * 0.40f;
    int32_t pr = std::max<int32_t>(10, (int32_t)(r * 0.65f));
    canvas.fillSmoothCircle((int32_t)(cx + pupilShiftX), (int32_t)(cy + pupilShiftY), pr, currentTheme.bg);

    // Inner reticle crosshair inside pupil
    canvas.drawFastHLine((int32_t)(cx + pupilShiftX - 4), (int32_t)(cy + pupilShiftY), 9, currentTheme.glow);
    canvas.drawFastVLine((int32_t)(cx + pupilShiftX), (int32_t)(cy + pupilShiftY - 4), 9, currentTheme.glow);

    // 5. Specular Highlights / Glints (3D glass lens curvature illusion)
    // Primary glint (Upper)
    float glint1X = cx - w * 0.20f - gazeX * 0.15f;
    float glint1Y = cy - h * 0.22f - gazeY * 0.15f;
    canvas.fillSmoothCircle((int32_t)glint1X, (int32_t)glint1Y, 5, TFT_WHITE);
    canvas.fillSmoothCircle((int32_t)(glint1X - 0.5f), (int32_t)(glint1Y - 0.5f), 3, currentTheme.secondary);

    // Secondary micro-glint (Lower)
    float glint2X = cx + w * 0.20f - gazeX * 0.10f;
    float glint2Y = cy + h * 0.20f - gazeY * 0.10f;
    canvas.fillSmoothCircle((int32_t)glint2X, (int32_t)glint2Y, 2, currentTheme.secondary);

    // 6. Eyelid Cutting & Slant
    float dx = (w + 14.0f) / 2.0f;
    float dyTilt = tanf(slant) * dx;
    if (!isLeft) dyTilt = -dyTilt; // Mirror tilt for right eye

    // Upper eyelid shutter
    if (upperOpen < 0.98f) {
        float cutY = (cy - h / 2.0f) + h * (1.0f - upperOpen);
        float yL = cutY - dyTilt;
        float yR = cutY + dyTilt;

        // Fill background over the top
        canvas.fillTriangle((int32_t)(cx - dx - 4), (int32_t)yL,
                            (int32_t)(cx + dx + 4), (int32_t)yR,
                            (int32_t)(cx - dx - 4), (int32_t)(cy - h / 2.0f - 20),
                            currentTheme.bg);
        canvas.fillTriangle((int32_t)(cx + dx + 4), (int32_t)yR,
                            (int32_t)(cx - dx - 4), (int32_t)(cy - h / 2.0f - 20),
                            (int32_t)(cx + dx + 4), (int32_t)(cy - h / 2.0f - 20),
                            currentTheme.bg);

        // Glowing mechanical eyelid rim line
        canvas.drawWideLine(cx - dx, yL, cx + dx, yR, 2.5f, currentTheme.glow);
        canvas.drawWideLine(cx - dx, yL - 1, cx + dx, yR - 1, 1.2f, currentTheme.primary);
    }

    // Lower eyelid squint
    if (lowerOpen < 0.98f) {
        float cutY = (cy + h / 2.0f) - h * (1.0f - lowerOpen);
        float yL = cutY + dyTilt;
        float yR = cutY - dyTilt;

        // Fill background under the bottom
        canvas.fillTriangle((int32_t)(cx - dx - 4), (int32_t)yL,
                            (int32_t)(cx + dx + 4), (int32_t)yR,
                            (int32_t)(cx - dx - 4), (int32_t)(cy + h / 2.0f + 20),
                            currentTheme.bg);
        canvas.fillTriangle((int32_t)(cx + dx + 4), (int32_t)yR,
                            (int32_t)(cx - dx - 4), (int32_t)(cy + h / 2.0f + 20),
                            (int32_t)(cx + dx + 4), (int32_t)(cy + h / 2.0f + 20),
                            currentTheme.bg);

        // Glowing lower rim line
        canvas.drawWideLine(cx - dx, yL, cx + dx, yR, 2.2f, currentTheme.glow);
        canvas.drawWideLine(cx - dx, yL + 1, cx + dx, yR + 1, 1.2f, currentTheme.primary);
    }
}

void RobotFace::drawHappyEye(float cx, float cy, bool isLeft) {
    // Joyful curved crescent anime/cyber arch: ^
    constexpr int NUM_PTS = 7;
    float halfW = eyeWidth * 0.44f;
    float archH = eyeHeight * 0.48f;
    float baseY = cy + archH * 0.35f;

    float ptsX[NUM_PTS];
    float ptsY[NUM_PTS];

    for (int i = 0; i < NUM_PTS; ++i) {
        float t = (float)i / (float)(NUM_PTS - 1); // 0.0 to 1.0
        ptsX[i] = cx - halfW + (2.0f * halfW) * t;
        ptsY[i] = baseY - archH * sinf(t * M_PI);
    }

    // Draw outer glow segments
    for (int i = 0; i < NUM_PTS - 1; ++i) {
        canvas.drawWideLine(ptsX[i], ptsY[i], ptsX[i + 1], ptsY[i + 1], 6.5f, currentTheme.glow);
    }

    // Draw main vibrant arch body
    for (int i = 0; i < NUM_PTS - 1; ++i) {
        canvas.drawWideLine(ptsX[i], ptsY[i], ptsX[i + 1], ptsY[i + 1], 4.0f, currentTheme.primary);
    }

    // Draw laser-white core
    for (int i = 0; i < NUM_PTS - 1; ++i) {
        canvas.drawWideLine(ptsX[i], ptsY[i], ptsX[i + 1], ptsY[i + 1], 1.8f, currentTheme.secondary);
    }

    // Cheerful upturned rounded tips
    canvas.fillSmoothCircle(ptsX[0], ptsY[0], 2.8f, currentTheme.primary);
    canvas.fillSmoothCircle(ptsX[NUM_PTS - 1], ptsY[NUM_PTS - 1], 2.8f, currentTheme.primary);
}

void RobotFace::drawWinkEye(float cx, float cy, bool isLeft) {
    // Left eye winks: sleek closed smiling slit with flutter eyelash
    float halfW = eyeWidth * 0.40f;
    float startX = cx - halfW;
    float endX   = cx + halfW;
    float midY   = cy + 4.0f;

    // Curved smiling line
    canvas.drawWideLine(startX, midY, cx, midY - 6.0f, 4.0f, currentTheme.primary);
    canvas.drawWideLine(cx, midY - 6.0f, endX, midY, 4.0f, currentTheme.primary);
    canvas.drawWideLine(startX, midY, cx, midY - 6.0f, 1.8f, currentTheme.secondary);
    canvas.drawWideLine(cx, midY - 6.0f, endX, midY, 1.8f, currentTheme.secondary);

    // Cute flutter lash at outer edge
    canvas.drawWideLine(startX, midY, startX - 7.0f, midY - 7.0f, 2.5f, currentTheme.primary);
    canvas.drawWideLine(startX, midY, startX - 8.0f, midY - 1.0f, 2.0f, currentTheme.glow);

    // Radiant Starburst Sparkle above the right eye
    float starX = EYE_CENTER_RIGHT_X + gazeX * 0.5f - 18.0f;
    float starY = EYE_NOMINAL_Y + gazeY * 0.5f - 24.0f;
    float starLen = 8.0f + 2.0f * sinf(globalTime * 6.0f);

    canvas.drawWideLine(starX - starLen, starY, starX + starLen, starY, 2.0f, currentTheme.accent);
    canvas.drawWideLine(starX, starY - starLen, starX, starY + starLen, 2.0f, currentTheme.accent);
    canvas.fillSmoothCircle(starX, starY, 3, TFT_WHITE);
}

void RobotFace::drawEyebrow(float cx, float cy, float angle, float length) {
    float halfL = length / 2.0f;
    float cosA = cosf(angle);
    float sinA = sinf(angle);

    float x0 = cx - halfL * cosA;
    float y0 = cy - halfL * sinA;
    float x1 = cx + halfL * cosA;
    float y1 = cy + halfL * sinA;

    // Outer glow
    canvas.drawWideLine(x0, y0, x1, y1, 5.5f, currentTheme.glow);
    // Main brow body
    canvas.drawWideLine(x0, y0, x1, y1, 3.5f, currentTheme.primary);
    // Bright core
    canvas.drawWideLine(x0, y0, x1, y1, 1.5f, currentTheme.secondary);
}

void RobotFace::drawMouth() {
    constexpr int32_t MCX = SCREEN_WIDTH / 2;
    constexpr int32_t MCY = 192;

    if (currentEmotion == RobotEmotion::Happy || currentEmotion == RobotEmotion::Dasara || isBeingPetted) {
        // Glowing curved smile
        constexpr int NUM_SMILE_PTS = 6;
        float halfW = 28.0f;
        float smileH = 14.0f;
        float ptsX[NUM_SMILE_PTS];
        float ptsY[NUM_SMILE_PTS];

        for (int i = 0; i < NUM_SMILE_PTS; ++i) {
            float t = (float)i / (float)(NUM_SMILE_PTS - 1);
            ptsX[i] = (float)MCX - halfW + (2.0f * halfW) * t;
            ptsY[i] = (float)MCY - 4.0f + smileH * sinf(t * M_PI);
        }

        for (int i = 0; i < NUM_SMILE_PTS - 1; ++i) {
            canvas.drawWideLine(ptsX[i], ptsY[i], ptsX[i + 1], ptsY[i + 1], 5.0f, currentTheme.glow);
            canvas.drawWideLine(ptsX[i], ptsY[i], ptsX[i + 1], ptsY[i + 1], 3.0f, currentTheme.primary);
            canvas.drawWideLine(ptsX[i], ptsY[i], ptsX[i + 1], ptsY[i + 1], 1.4f, currentTheme.secondary);
        }

        // Cute dimple dots at smile ends
        canvas.fillSmoothCircle(ptsX[0], ptsY[0], 2.2f, currentTheme.accent);
        canvas.fillSmoothCircle(ptsX[NUM_SMILE_PTS - 1], ptsY[NUM_SMILE_PTS - 1], 2.2f, currentTheme.accent);
    } else if (currentEmotion == RobotEmotion::Surprised) {
        // Surprised 'O' aperture
        canvas.drawEllipse(MCX, MCY, 10, 14, currentTheme.glow);
        canvas.drawEllipse(MCX, MCY, 9, 13, currentTheme.primary);
        canvas.drawEllipse(MCX, MCY, 7, 11, currentTheme.secondary);
        canvas.fillEllipse(MCX, MCY, 5, 9, currentTheme.bg);
    } else {
        // 9-Bar Animated Voice Synthesizer Waveform (Fast rectilinear fill)
        for (int i = 0; i < 9; ++i) {
            int32_t barX = MCX + (i - 4) * 8;
            int32_t h = (int32_t)voiceHeights[i];
            int32_t topY = MCY - h / 2;

            // Bar halo (width 4)
            canvas.fillRect(barX - 2, topY - 1, 4, h + 2, currentTheme.glow);
            // Main bar (width 2)
            canvas.fillRect(barX - 1, topY, 2, h, currentTheme.primary);
            // Tip caps
            canvas.fillRect(barX - 1, topY, 2, 1, currentTheme.secondary);
            canvas.fillRect(barX - 1, topY + h - 1, 2, 1, currentTheme.secondary);
        }
    }
}

void RobotFace::drawCheekBlush() {
    if (blushIntensity <= 0.05f) return;

    // Left cheek: 2 angled glowing neon dashes
    float lx1 = 62.0f, ly1 = 152.0f;
    float lx2 = 72.0f, ly2 = 155.0f;
    canvas.drawWideLine(lx1, ly1, lx1 + 8.0f, ly1 - 8.0f, 3.2f, currentTheme.accent);
    canvas.drawWideLine(lx2, ly2, lx2 + 8.0f, ly2 - 8.0f, 3.2f, currentTheme.accent);

    // Right cheek: 2 angled glowing neon dashes (mirrored)
    float rx1 = SCREEN_WIDTH - 62.0f, ry1 = 152.0f;
    float rx2 = SCREEN_WIDTH - 72.0f, ry2 = 155.0f;
    canvas.drawWideLine(rx1, ry1, rx1 - 8.0f, ry1 - 8.0f, 3.2f, currentTheme.accent);
    canvas.drawWideLine(rx2, ry2, rx2 - 8.0f, ry2 - 8.0f, 3.2f, currentTheme.accent);
}

void RobotFace::drawHolographicAccents() {
    // 1. Curious: Rotating cyber data reticle
    if (currentEmotion == RobotEmotion::Curious) {
        constexpr float RCX = 262.0f, RCY = 46.0f;
        float angle = globalTime * 3.5f;

        canvas.drawArc((int32_t)RCX, (int32_t)RCY, 11, 13, angle * 57.295f, angle * 57.295f + 70.0f, currentTheme.accent);
        canvas.drawArc((int32_t)RCX, (int32_t)RCY, 11, 13, (angle + 2.09f) * 57.295f, (angle + 2.09f) * 57.295f + 70.0f, currentTheme.accent);
        canvas.drawArc((int32_t)RCX, (int32_t)RCY, 11, 13, (angle + 4.18f) * 57.295f, (angle + 4.18f) * 57.295f + 70.0f, currentTheme.accent);
        canvas.fillSmoothCircle((int32_t)RCX, (int32_t)RCY, 2, currentTheme.secondary);
    }
    // 2. Surprised: Pulsing alert beacon !
    else if (currentEmotion == RobotEmotion::Surprised) {
        constexpr float ACX = 262.0f, ACY = 44.0f;
        float scale = 1.0f + 0.15f * sinf(globalTime * 12.0f);
        canvas.drawWideLine(ACX, ACY - 8.0f * scale, ACX, ACY + 3.0f * scale, 3.5f * scale, currentTheme.accent);
        canvas.fillSmoothCircle((int32_t)ACX, (int32_t)(ACY + 8.0f * scale), (int32_t)(2.2f * scale), currentTheme.accent);
    }
    // 3. Sleepy: Drifting "Z" glyphs
    else if (currentEmotion == RobotEmotion::Sleepy) {
        float zOffset1 = fmodf(globalTime * 16.0f, 40.0f);
        float zX1 = 252.0f + sinf(zOffset1 * 0.1f) * 6.0f;
        float zY1 = 70.0f - zOffset1;

        canvas.setTextSize(1);
        canvas.setTextColor(currentTheme.accent, currentTheme.bg);
        canvas.drawString("z", (int32_t)zX1, (int32_t)zY1);

        float zOffset2 = fmodf(globalTime * 16.0f + 20.0f, 40.0f);
        float zX2 = 266.0f + sinf(zOffset2 * 0.1f) * 6.0f;
        float zY2 = 70.0f - zOffset2;
        canvas.setTextSize(2);
        canvas.drawString("Z", (int32_t)zX2, (int32_t)zY2);
    }
    // 4. Focused: Precision reticle scan line
    else if (currentEmotion == RobotEmotion::Focused) {
        float scanY = EYE_NOMINAL_Y + sinf(globalTime * 5.0f) * 16.0f;
        canvas.drawFastHLine(60, (int32_t)scanY, 200, currentTheme.glow);
        canvas.drawPixel(160, (int32_t)scanY, currentTheme.accent);
    }
}

void RobotFace::drawFestiveTilak(float cx, float cy) {
    // Sacred Chandan & Kumkum Tilak on Forehead between Eyebrows
    // 1. Soft ambient golden aura
    canvas.fillSmoothCircle((int32_t)cx, (int32_t)(cy + 2.0f), 10, currentTheme.glow);

    // 2. Sandalwood (Chandan) U-pundra crescent curve
    // Left vertical arm
    canvas.drawWideLine(cx - 5.5f, cy - 9.0f, cx - 5.5f, cy + 1.0f, 2.8f, currentTheme.primary);
    // Right vertical arm
    canvas.drawWideLine(cx + 5.5f, cy - 9.0f, cx + 5.5f, cy + 1.0f, 2.8f, currentTheme.primary);
    // Bottom connector curve
    canvas.drawWideLine(cx - 5.5f, cy + 1.0f, cx, cy + 6.0f, 2.8f, currentTheme.primary);
    canvas.drawWideLine(cx + 5.5f, cy + 1.0f, cx, cy + 6.0f, 2.8f, currentTheme.primary);

    // Luminous core highlights
    canvas.drawWideLine(cx - 5.5f, cy - 8.0f, cx - 5.5f, cy + 1.0f, 1.2f, currentTheme.secondary);
    canvas.drawWideLine(cx + 5.5f, cy - 8.0f, cx + 5.5f, cy + 1.0f, 1.2f, currentTheme.secondary);
    canvas.drawWideLine(cx - 5.5f, cy + 1.0f, cx, cy + 5.5f, 1.2f, currentTheme.secondary);
    canvas.drawWideLine(cx + 5.5f, cy + 1.0f, cx, cy + 5.5f, 1.2f, currentTheme.secondary);

    // Upturned tips
    canvas.fillSmoothCircle(cx - 5.5f, cy - 9.0f, 1.6f, currentTheme.secondary);
    canvas.fillSmoothCircle(cx + 5.5f, cy - 9.0f, 1.6f, currentTheme.secondary);

    // 3. Central Kumkum (Vermilion) Bindu & vertical flame streak
    float kumkumY = cy - 2.0f;
    canvas.fillSmoothCircle((int32_t)cx, (int32_t)kumkumY, 4, 0x8000); // Shadow outline
    canvas.fillSmoothCircle((int32_t)cx, (int32_t)kumkumY, 3, currentTheme.accent); // Kumkum red
    canvas.drawWideLine(cx, kumkumY - 5.0f, cx, kumkumY + 2.0f, 2.0f, currentTheme.accent);
    canvas.fillSmoothCircle((int32_t)(cx - 0.7f), (int32_t)(kumkumY - 1.0f), 1.0f, TFT_WHITE); // Divine glint
}

void RobotFace::drawDiya(float x, float y, float scale, float flamePhase) {
    // Traditional Clay / Brass Diya with animated flickering flame (Jyoti)
    // 1. Ambient flame glow bloom
    float pulse = 0.5f + 0.5f * sinf(flamePhase * 3.0f);
    float bloomR = (16.0f + 3.0f * pulse) * scale;
    canvas.fillSmoothCircle((int32_t)x, (int32_t)(y - 6.0f * scale), (int32_t)bloomR, 0x4100);
    canvas.fillSmoothCircle((int32_t)x, (int32_t)(y - 6.0f * scale), (int32_t)(bloomR * 0.65f), 0x7200);

    // 2. Terracotta / Brass Diya base
    // Lower bowl
    canvas.fillSmoothRoundRect((int32_t)(x - 14.0f * scale), (int32_t)y,
                               (int32_t)(28.0f * scale), (int32_t)(10.0f * scale),
                               (int32_t)(4.0f * scale), 0xB2A0);
    // Base pedestal
    canvas.fillEllipse((int32_t)x, (int32_t)(y + 8.0f * scale),
                       (int32_t)(9.0f * scale), (int32_t)(4.0f * scale), 0x8180);

    // Gold decorative lip / rim
    canvas.drawWideLine(x - 15.0f * scale, y, x + 15.0f * scale, y, 2.5f * scale, 0xFDC0);
    canvas.drawWideLine(x - 13.0f * scale, y - 0.5f * scale, x + 13.0f * scale, y - 0.5f * scale, 1.2f * scale, 0xFFFF);

    // Oil reservoir
    canvas.fillEllipse((int32_t)x, (int32_t)(y + 2.0f * scale),
                       (int32_t)(10.0f * scale), (int32_t)(3.0f * scale), 0x91A0);
    canvas.drawFastHLine((int32_t)(x - 5.0f * scale), (int32_t)(y + 2.0f * scale),
                         (int32_t)(10.0f * scale), 0xFE20);

    // 3. Cotton Wick (Batti)
    canvas.drawWideLine(x, y + 2.0f * scale, x, y - 2.0f * scale, 1.5f * scale, 0x2940);

    // 4. Animated Flickering Flame (Jyoti)
    float sway = sinf(flamePhase * 3.5f) * 1.6f * scale;
    float flickH = (14.0f + 2.5f * sinf(flamePhase * 4.2f) + 1.2f * cosf(flamePhase * 6.8f)) * scale;
    float tipX = x + sway;
    float tipY = y - flickH;
    float midY = y - flickH * 0.45f;
    float flameHalfW = (5.5f + 0.8f * cosf(flamePhase * 3.8f)) * scale;

    // Outer Saffron / Orange flame
    canvas.fillTriangle((int32_t)(x - flameHalfW), (int32_t)midY,
                        (int32_t)(x + flameHalfW), (int32_t)midY,
                        (int32_t)tipX, (int32_t)tipY,
                        0xFD20);
    canvas.fillEllipse((int32_t)x, (int32_t)midY, (int32_t)flameHalfW, (int32_t)(flameHalfW * 1.1f), 0xFD20);

    // Inner bright Marigold Yellow flame
    float innerW = flameHalfW * 0.65f;
    float innerTipY = tipY + 3.0f * scale;
    canvas.fillTriangle((int32_t)(x - innerW), (int32_t)midY,
                        (int32_t)(x + innerW), (int32_t)midY,
                        (int32_t)(tipX * 0.7f + x * 0.3f), (int32_t)innerTipY,
                        0xFFE0);
    canvas.fillEllipse((int32_t)x, (int32_t)midY, (int32_t)innerW, (int32_t)(innerW * 1.0f), 0xFFE0);

    // White-hot flame core
    canvas.fillSmoothCircle((int32_t)x, (int32_t)(midY + 1.0f * scale), (int32_t)(2.2f * scale), TFT_WHITE);
    canvas.drawWideLine(x, midY + 1.0f * scale, tipX * 0.5f + x * 0.5f, innerTipY + 2.0f * scale, 1.4f * scale, TFT_WHITE);
}

void RobotFace::drawFestiveSparkles() {
    // 6 Procedural celebratory sparkling particles drifting upwards
    struct SparkleItem {
        float x;
        float speedY;
        float swayFreq;
        float swayAmp;
        float timeOffset;
        uint16_t color;
    };

    static const SparkleItem SPARKLES[] = {
        { 45.0f,  24.0f, 2.1f,  9.0f,  0.0f, 0xFE20 }, // Saffron Gold
        { 82.0f,  19.0f, 2.7f, 11.0f,  1.8f, 0xFFFF }, // White Star
        { 135.0f, 22.0f, 1.8f, 14.0f,  3.5f, 0xF800 }, // Kumkum Red
        { 185.0f, 20.0f, 2.4f, 12.0f,  0.9f, 0xFE20 }, // Saffron Gold
        { 238.0f, 25.0f, 1.9f, 10.0f,  2.7f, 0xFFFF }, // White Star
        { 275.0f, 21.0f, 2.5f,  8.0f,  4.2f, 0xF800 }  // Kumkum Red
    };

    for (const auto& sp : SPARKLES) {
        float elapsed = globalTime + sp.timeOffset;
        float yDist = fmodf(elapsed * sp.speedY, 190.0f);
        float py = 215.0f - yDist;
        float px = sp.x + sinf(elapsed * sp.swayFreq) * sp.swayAmp;

        // Twinkle factor
        float twinkle = 0.5f + 0.5f * sinf(elapsed * 7.5f);
        if (twinkle < 0.25f) continue;

        float len = 2.0f + 3.0f * twinkle;

        // 4-point diamond starburst
        canvas.drawFastHLine((int32_t)(px - len), (int32_t)py, (int32_t)(len * 2.0f + 1), sp.color);
        canvas.drawFastVLine((int32_t)px, (int32_t)(py - len), (int32_t)(len * 2.0f + 1), sp.color);
        canvas.drawPixel((int32_t)px, (int32_t)py, TFT_WHITE);
    }
}

void RobotFace::setPerfStats(float fps, float cpuCore1, float cpuCore2, float cpuTotal, uint32_t freeHeap) {
    perfFps = fps;
    perfCpuCore1 = cpuCore1;
    perfCpuCore2 = cpuCore2;
    perfCpuTotal = (cpuTotal >= 0.0f) ? cpuTotal : ((cpuCore1 + cpuCore2) * 0.5f);
    perfFreeHeap = freeHeap;
}

void RobotFace::cyclePerfOverlayMode() {
    int next = ((int)perfMode + 1) % (int)PerfOverlayMode::COUNT;
    perfMode = (PerfOverlayMode)next;
}

bool RobotFace::isTouchOnOverlay(int32_t x, int32_t y) const {
    if (perfMode == PerfOverlayMode::Off) {
        // Invisible touch target at bottom center to re-enable overlay
        constexpr int32_t HZ_W = 120, HZ_H = 24;
        int32_t hx = (SCREEN_WIDTH - HZ_W) / 2;
        int32_t hy = SCREEN_HEIGHT - HZ_H;
        return (x >= hx && x <= hx + HZ_W && y >= hy && y <= SCREEN_HEIGHT);
    }
    // Generous touch tolerance (+10px horizontal, +8px vertical padding around badge)
    return (x >= (overlayX - 10) && x <= (overlayX + overlayW + 10) &&
            y >= (overlayY - 8) && y <= (overlayY + overlayH + 8));
}

void RobotFace::drawPerfOverlay() {
    if (perfMode == PerfOverlayMode::Off) {
        overlayW = 0;
        overlayH = 0;
        return;
    }

    int32_t w = 0, h = 14;
    switch (perfMode) {
        case PerfOverlayMode::Compact:
            w = 120;
            break;
        case PerfOverlayMode::Detailed:
            w = 168;
            break;
        case PerfOverlayMode::Minimal:
            w = 98;
            h = 13;
            break;
        default:
            return;
    }

    int32_t x = 0, y = 0;
    switch (perfPos) {
        case PerfOverlayPosition::BottomCenter:
            x = (SCREEN_WIDTH - w) / 2;
            y = SCREEN_HEIGHT - h - 3;
            break;
        case PerfOverlayPosition::TopCenter:
            x = (SCREEN_WIDTH - w) / 2;
            y = 12;
            break;
        case PerfOverlayPosition::TopRight:
            x = SCREEN_WIDTH - w - 8;
            y = 12;
            break;
        case PerfOverlayPosition::BottomRight:
            x = SCREEN_WIDTH - w - 8;
            y = SCREEN_HEIGHT - h - 3;
            break;
    }

    overlayX = x;
    overlayY = y;
    overlayW = w;
    overlayH = h;

    // 1. Draw Slim Glassmorphic Capsule
    canvas.fillRoundRect(x, y, w, h, 3, currentTheme.bg);
    canvas.drawRoundRect(x, y, w, h, 3, currentTheme.glow);

    // Micro corner ticks
    canvas.drawPixel(x + 1, y + 1, currentTheme.primary);
    canvas.drawPixel(x + w - 2, y + 1, currentTheme.primary);
    canvas.drawPixel(x + 1, y + h - 2, currentTheme.primary);
    canvas.drawPixel(x + w - 2, y + h - 2, currentTheme.primary);

    canvas.setTextSize(1);

    // Dynamic FPS color alert
    uint16_t fpsCol = (perfFps >= 50.0f) ? currentTheme.secondary :
                      (perfFps >= 30.0f) ? (uint16_t)0xFDE0 : (uint16_t)0xFA00;

    // Dynamic Core 1 & Core 2 load color alert
    uint16_t c1Col = (perfCpuCore1 < 50.0f) ? currentTheme.secondary :
                     (perfCpuCore1 < 80.0f) ? (uint16_t)0xFDE0 : (uint16_t)0xFA00;
    uint16_t c2Col = (perfCpuCore2 < 50.0f) ? currentTheme.secondary :
                     (perfCpuCore2 < 80.0f) ? (uint16_t)0xFDE0 : (uint16_t)0xFA00;

    if (perfMode == PerfOverlayMode::Compact) {
        // [ 30fps │ C1 12% │ C2 34% ● ] (Ultra-compact 120x14 px)
        // FPS section
        char fpsVal[16];
        snprintf(fpsVal, sizeof(fpsVal), "%2.0f", perfFps);
        canvas.setTextColor(fpsCol, currentTheme.bg);
        canvas.drawString(fpsVal, x + 5, y + 3);

        canvas.setTextColor(currentTheme.primary, currentTheme.bg);
        canvas.drawString("f", x + 18, y + 3);

        // Divider 1
        canvas.drawFastVLine(x + 28, y + 2, h - 4, currentTheme.glow);
        canvas.drawPixel(x + 28, y + h / 2, currentTheme.primary);

        // Core 1 section
        canvas.setTextColor(currentTheme.primary, currentTheme.bg);
        canvas.drawString("C1", x + 33, y + 3);

        char c1Str[16];
        snprintf(c1Str, sizeof(c1Str), "%2.0f%%", (perfCpuCore1 < 0.0f) ? 0.0f : perfCpuCore1);
        canvas.setTextColor(c1Col, currentTheme.bg);
        canvas.drawString(c1Str, x + 47, y + 3);

        // Divider 2
        canvas.drawFastVLine(x + 69, y + 2, h - 4, currentTheme.glow);
        canvas.drawPixel(x + 69, y + h / 2, currentTheme.primary);

        // Core 2 section
        canvas.setTextColor(currentTheme.primary, currentTheme.bg);
        canvas.drawString("C2", x + 74, y + 3);

        char c2Str[16];
        snprintf(c2Str, sizeof(c2Str), "%2.0f%%", (perfCpuCore2 < 0.0f) ? 0.0f : perfCpuCore2);
        canvas.setTextColor(c2Col, currentTheme.bg);
        canvas.drawString(c2Str, x + 88, y + 3);

        // Micro activity pulse dot
        float pulse = fmodf(globalTime * 3.0f, 1.0f);
        uint16_t pipCol = (pulse < 0.35f) ? currentTheme.secondary : currentTheme.glow;
        canvas.drawPixel(x + 112, y + h / 2, pipCol);

    } else if (perfMode == PerfOverlayMode::Detailed) {
        // [ 30fps │ C1 12% │ C2 34% │ 284K ] (168x14 px)
        char fpsVal[16];
        snprintf(fpsVal, sizeof(fpsVal), "%2.0f", perfFps);
        canvas.setTextColor(fpsCol, currentTheme.bg);
        canvas.drawString(fpsVal, x + 5, y + 3);
        canvas.setTextColor(currentTheme.primary, currentTheme.bg);
        canvas.drawString("fps", x + 18, y + 3);

        canvas.drawFastVLine(x + 39, y + 2, h - 4, currentTheme.glow);

        canvas.setTextColor(currentTheme.primary, currentTheme.bg);
        canvas.drawString("C1", x + 44, y + 3);
        char c1Str[16];
        snprintf(c1Str, sizeof(c1Str), "%2.0f%%", (perfCpuCore1 < 0.0f) ? 0.0f : perfCpuCore1);
        canvas.setTextColor(c1Col, currentTheme.bg);
        canvas.drawString(c1Str, x + 58, y + 3);

        canvas.drawFastVLine(x + 80, y + 2, h - 4, currentTheme.glow);

        canvas.setTextColor(currentTheme.primary, currentTheme.bg);
        canvas.drawString("C2", x + 85, y + 3);
        char c2Str[16];
        snprintf(c2Str, sizeof(c2Str), "%2.0f%%", (perfCpuCore2 < 0.0f) ? 0.0f : perfCpuCore2);
        canvas.setTextColor(c2Col, currentTheme.bg);
        canvas.drawString(c2Str, x + 99, y + 3);

        canvas.drawFastVLine(x + 121, y + 2, h - 4, currentTheme.glow);

        canvas.setTextColor(currentTheme.primary, currentTheme.bg);
        canvas.drawString("M", x + 126, y + 3);
        char memStr[16];
        snprintf(memStr, sizeof(memStr), "%3uK", (unsigned int)(perfFreeHeap / 1024));
        canvas.setTextColor(currentTheme.secondary, currentTheme.bg);
        canvas.drawString(memStr, x + 134, y + 3);

        float pulse = fmodf(globalTime * 3.0f, 1.0f);
        uint16_t pipCol = (pulse < 0.35f) ? currentTheme.secondary : currentTheme.glow;
        canvas.drawPixel(x + w - 6, y + h / 2, pipCol);

    } else if (perfMode == PerfOverlayMode::Minimal) {
        // [ 60f · 12% · 34% ] (98x13 px)
        char fpsStr[16];
        snprintf(fpsStr, sizeof(fpsStr), "%2.0ff", perfFps);
        canvas.setTextColor(fpsCol, currentTheme.bg);
        canvas.drawString(fpsStr, x + 5, y + 3);

        canvas.fillCircle(x + 28, y + h / 2, 1, currentTheme.glow);

        char c1Str[16];
        snprintf(c1Str, sizeof(c1Str), "%2.0f%%", (perfCpuCore1 < 0.0f) ? 0.0f : perfCpuCore1);
        canvas.setTextColor(c1Col, currentTheme.bg);
        canvas.drawString(c1Str, x + 34, y + 3);

        canvas.fillCircle(x + 59, y + h / 2, 1, currentTheme.glow);

        char c2Str[16];
        snprintf(c2Str, sizeof(c2Str), "%2.0f%%", (perfCpuCore2 < 0.0f) ? 0.0f : perfCpuCore2);
        canvas.setTextColor(c2Col, currentTheme.bg);
        canvas.drawString(c2Str, x + 65, y + 3);

        float pulse = fmodf(globalTime * 3.0f, 1.0f);
        uint16_t pipCol = (pulse < 0.35f) ? currentTheme.secondary : currentTheme.glow;
        canvas.drawPixel(x + w - 6, y + h / 2, pipCol);
    }
}

void RobotFace::setWifiStats(bool enabled, bool connected, int8_t rssi) {
    wifiEnabled = enabled;
    wifiConnected = enabled && connected;
    wifiRssi = rssi;
}

void RobotFace::drawWifiIndicator(int32_t x, int32_t y) {
    if (!wifiEnabled) return;

    // Inline 27x10 marker: [ ((o)) |||| ]
    int bars = 0;
    uint16_t linkCol = currentTheme.glow;
    if (wifiConnected) {
        if (wifiRssi >= -60) {
            bars = 4;
            linkCol = currentTheme.secondary;
        } else if (wifiRssi >= -70) {
            bars = 3;
            linkCol = currentTheme.primary;
        } else if (wifiRssi >= -80) {
            bars = 2;
            linkCol = (uint16_t)0xFDE0; // Amber: weak link
        } else {
            bars = 1;
            linkCol = (uint16_t)0xFA00; // Red: very weak link
        }
    }

    bool blink = fmodf(globalTime * 1.2f, 1.0f) < 0.55f;
    uint16_t iconCol =
        wifiConnected ? linkCol : (blink ? currentTheme.accent : currentTheme.glow);

    // Wi-Fi fan icon (dot + three arcs)
    const int32_t cx = x + 7;
    const int32_t cy = y + 9;
    canvas.fillCircle(cx, cy, 1, iconCol);
    canvas.drawArc(cx, cy, 2, 3, 225.0f, 315.0f, iconCol);
    canvas.drawArc(cx, cy, 4, 5, 225.0f, 315.0f, iconCol);
    canvas.drawArc(cx, cy, 6, 7, 225.0f, 315.0f, iconCol);

    if (!wifiConnected) {
        // Slash through the fan while the station is retrying
        canvas.drawLine(cx - 6, cy - 5, cx + 4, cy + 1, currentTheme.accent);
    }

    // Four ascending signal bars
    for (int i = 0; i < 4; ++i) {
        int32_t bh = 3 + i * 2;
        uint16_t barCol = (i < bars) ? linkCol : currentTheme.glow;
        canvas.fillRect(x + 16 + i * 3, cy - bh, 2, bh, barCol);
    }
}
