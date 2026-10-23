#pragma once

#define LGFX_USE_V1
#include <LovyanGFX.hpp>

/**
 * @brief LovyanGFX Configuration for FlxOS Profile: ESP32-S3 + ILI9341 + XPT2046
 *
 * Profile ID: esp32s3-ili9341-xpt
 * Target: ESP32-S3 (16MB Flash QIO, 80MHz Octal PSRAM with XiP & ECC)
 * Display: ILI9341 (240x320 SPI, CS: 10, DC: 9, RST: 14, BL: 7, 40MHz)
 * Touch: XPT2046 (SPI, CS: 5, INT: 6, Shared SPI Bus SCLK: 12, MOSI: 11, MISO: 13, 1MHz)
 */
class LGFX : public lgfx::LGFX_Device
{
    lgfx::Panel_ILI9341 _panel_instance;
    lgfx::Bus_SPI       _bus_instance;
    lgfx::Light_PWM     _light_instance;
    lgfx::Touch_XPT2046 _touch_instance;

public:
    LGFX(void)
    {
        { // SPI Bus Configuration
            auto cfg = _bus_instance.config();

            // SPI host 2 corresponds to SPI2_HOST (FSPI on ESP32-S3)
            cfg.spi_host   = SPI2_HOST;
            cfg.spi_mode   = 0;
            cfg.freq_write = 40000000;    // 40 MHz stable write frequency for ILI9341
            cfg.freq_read  = 16000000;    // 16 MHz read frequency
            cfg.spi_3wire  = false;       // 4-wire SPI (MOSI/MISO separate)
            cfg.use_lock   = true;        // SPI bus shared with touch
            cfg.dma_channel = SPI_DMA_CH_AUTO;

            cfg.pin_sclk   = 12;
            cfg.pin_mosi   = 11;
            cfg.pin_miso   = 13;
            cfg.pin_dc     = 9;

            _bus_instance.config(cfg);
            _panel_instance.setBus(&_bus_instance);
        }

        { // ILI9341 Display Panel Configuration
            auto cfg = _panel_instance.config();

            cfg.pin_cs           = 10;
            cfg.pin_rst          = 14;
            cfg.pin_busy         = -1;
            cfg.panel_width      = 240;
            cfg.panel_height     = 320;
            cfg.memory_width     = 240;
            cfg.memory_height    = 320;
            cfg.offset_x         = 0;
            cfg.offset_y         = 0;
            cfg.offset_rotation  = 0;
            cfg.dummy_read_pixel = 8;
            cfg.dummy_read_bits  = 1;
            cfg.readable         = true;
            cfg.invert           = false;
            cfg.rgb_order        = false; // BGR format standard for ILI9341
            cfg.dlen_16bit       = false;
            cfg.bus_shared       = true;  // Bus shared with Touch

            _panel_instance.config(cfg);
        }

        { // Backlight Configuration (PWM on GPIO 7)
            auto cfg = _light_instance.config();

            cfg.pin_bl      = 7;
            cfg.invert      = false;
            cfg.freq        = 20000;      // 20 kHz PWM frequency
            cfg.pwm_channel = 0;

            _light_instance.config(cfg);
            _panel_instance.setLight(&_light_instance);
        }

        { // XPT2046 Touch Controller Configuration
            auto cfg = _touch_instance.config();

            // Calibration values from FlxOS profile
            cfg.x_min           = 3800;
            cfg.x_max           = 200;
            cfg.y_min           = 200;
            cfg.y_max           = 3800;
            cfg.pin_int         = 6;
            cfg.pin_cs          = 5;
            cfg.bus_shared      = true;   // Shared SPI bus

            cfg.spi_host        = SPI2_HOST;
            cfg.freq            = 1000000; // 1 MHz clock for touch controller
            cfg.pin_sclk        = 12;
            cfg.pin_mosi        = 11;
            cfg.pin_miso        = 13;
            cfg.offset_rotation = 0;

            _touch_instance.config(cfg);
            _panel_instance.setTouch(&_touch_instance);
        }

        setPanel(&_panel_instance);
    }
};
