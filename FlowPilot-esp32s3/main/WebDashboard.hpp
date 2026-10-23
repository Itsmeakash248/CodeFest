#pragma once

#include <cstddef>
#include <cstdint>

#include "esp_err.h"
#include "esp_http_server.h"

class LGFX;
class RobotFace;

/**
 * @brief LAN web dashboard and REST control surface for FlowPilot.
 *
 * Serves a self-contained single-page dashboard on port 80 and exposes a small
 * JSON API for driving, expressions, gaze, HUD settings and display brightness.
 *
 * The drive command is protected by a software dead-man lease: if the browser
 * stops sending updates (tab closed, Wi-Fi drop, crash), the control task brakes
 * the motors after WEB_DRIVE_TIMEOUT_MS.
 */
class WebDashboard {
public:
    WebDashboard();
    ~WebDashboard();

    /**
     * @brief Start the HTTP server and register all dashboard/API routes.
     * @param face RobotFace instance to control.
     * @param display LovyanGFX display used for backlight brightness.
     * @return ESP_OK on success.
     */
    esp_err_t begin(RobotFace& face, LGFX& display);

    /**
     * @brief Service the remote-drive dead-man timer. Call from the 100 Hz
     *        control task, before MotorDriver::update().
     */
    void update();

    bool isRunning() const { return server_ != nullptr; }

    static constexpr uint32_t DRIVE_TIMEOUT_MS = 800;

private:
    RobotFace* face_ = nullptr;
    LGFX* display_ = nullptr;
    httpd_handle_t server_ = nullptr;
    uint8_t brightness_ = 200;

    volatile bool webDriving_ = false;
    volatile uint32_t lastDriveMs_ = 0;

    esp_err_t registerHandlers();
    esp_err_t registerHandler(const char* uri, httpd_method_t method,
                              esp_err_t (*handler)(httpd_req_t*));

    static esp_err_t rootHandler(httpd_req_t* req);
    static esp_err_t statusHandler(httpd_req_t* req);
    static esp_err_t driveHandler(httpd_req_t* req);
    static esp_err_t stopHandler(httpd_req_t* req);
    static esp_err_t emotionHandler(httpd_req_t* req);
    static esp_err_t actionHandler(httpd_req_t* req);
    static esp_err_t lookHandler(httpd_req_t* req);
    static esp_err_t overlayHandler(httpd_req_t* req);
    static esp_err_t autonomyHandler(httpd_req_t* req);
    static esp_err_t displayHandler(httpd_req_t* req);
};
