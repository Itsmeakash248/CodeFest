#include "WebDashboard.hpp"

#include <algorithm>
#include <cerrno>
#include <climits>
#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <strings.h>

#include "LGFX_Config.hpp"
#include "MotorDriver.hpp"
#include "RobotFace.hpp"
#include "esp_log.h"
#include "esp_netif.h"
#include "esp_system.h"
#include "esp_timer.h"
#include "esp_wifi.h"
#include "freertos/FreeRTOS.h"

static const char* TAG = "WEB_DASHBOARD";

// Embedded by CMake (EMBED_TXTFILES "web/index.html").
extern const uint8_t index_html_start[] asm("_binary_index_html_start");
extern const uint8_t index_html_end[] asm("_binary_index_html_end");

namespace {

constexpr uint16_t WEB_PORT = 80;
constexpr uint32_t DRIVE_TIMEOUT_MS = WebDashboard::DRIVE_TIMEOUT_MS;

const char* emotionName(int id) {
    static const char* const names[] = {
        "Neutral", "Happy", "Curious", "Surprised", "Focused",
        "Sleepy", "Wink", "Sad", "Rage", "Happy Dasara",
    };
    if (id < 0 || id >= (int)(sizeof(names) / sizeof(names[0]))) {
        return "Unknown";
    }
    return names[id];
}

int emotionIdFromName(const char* name) {
    if (!name) {
        return -1;
    }
    for (int i = 0; i < (int)RobotEmotion::COUNT; ++i) {
        if (strcasecmp(name, emotionName(i)) == 0) {
            return i;
        }
    }
    if (strcasecmp(name, "dasara") == 0) {
        return (int)RobotEmotion::Dasara;
    }
    return -1;
}

const char* boolStr(bool value) { return value ? "true" : "false"; }

uint32_t nowMs() {
    return (uint32_t)(esp_timer_get_time() / 1000LL);
}

float clampf(float value, float low, float high) {
    return std::max(low, std::min(high, value));
}

bool queryValue(httpd_req_t* req, const char* key, char* value, size_t valueLen) {
    char query[192];
    if (httpd_req_get_url_query_str(req, query, sizeof(query)) != ESP_OK) {
        return false;
    }
    return httpd_query_key_value(query, key, value, valueLen) == ESP_OK;
}

bool queryInt(httpd_req_t* req, const char* key, int& out) {
    char value[24];
    if (!queryValue(req, key, value, sizeof(value))) {
        return false;
    }

    errno = 0;
    char* end = nullptr;
    long parsed = strtol(value, &end, 10);
    if (end == value || *end != '\0' || errno == ERANGE ||
        parsed < INT_MIN || parsed > INT_MAX) {
        return false;
    }
    out = (int)parsed;
    return true;
}

bool queryFloat(httpd_req_t* req, const char* key, float& out) {
    char value[24];
    if (!queryValue(req, key, value, sizeof(value))) {
        return false;
    }

    char* end = nullptr;
    float parsed = strtof(value, &end);
    if (end == value || *end != '\0' || !std::isfinite(parsed)) {
        return false;
    }
    out = parsed;
    return true;
}

WebDashboard* dashboardFrom(httpd_req_t* req) {
    return static_cast<WebDashboard*>(req->user_ctx);
}

esp_err_t sendJson(httpd_req_t* req, const char* body,
                   const char* status = "200 OK") {
    httpd_resp_set_status(req, status);
    httpd_resp_set_type(req, "application/json");
    httpd_resp_set_hdr(req, "Cache-Control", "no-store");
    return httpd_resp_send(req, body, HTTPD_RESP_USE_STRLEN);
}

esp_err_t sendOk(httpd_req_t* req) {
    return sendJson(req, "{\"ok\":true}");
}

esp_err_t sendError(httpd_req_t* req, const char* status, const char* message) {
    char body[192];
    snprintf(body, sizeof(body), "{\"ok\":false,\"error\":\"%s\"}", message);
    return sendJson(req, body, status);
}

}  // namespace

WebDashboard::WebDashboard() = default;

WebDashboard::~WebDashboard() {
    if (server_) {
        httpd_stop(server_);
        server_ = nullptr;
    }
}

esp_err_t WebDashboard::begin(RobotFace& face, LGFX& display) {
    if (server_) {
        return ESP_OK;
    }

    face_ = &face;
    display_ = &display;
    brightness_ = display.getBrightness();

    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    config.server_port = WEB_PORT;
    config.stack_size = 8192;
    config.task_priority = tskIDLE_PRIORITY + 3;
    config.max_uri_handlers = 16;
    config.lru_purge_enable = true;
    config.keep_alive_enable = true;
    config.keep_alive_idle = 5;
    config.keep_alive_interval = 2;
    config.keep_alive_count = 3;
    config.recv_wait_timeout = 10;
    config.send_wait_timeout = 10;

    esp_err_t err = httpd_start(&server_, &config);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "httpd_start failed: %s", esp_err_to_name(err));
        server_ = nullptr;
        return err;
    }

    err = registerHandlers();
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to register dashboard handlers: %s",
                 esp_err_to_name(err));
        httpd_stop(server_);
        server_ = nullptr;
        return err;
    }

    esp_netif_t* netif = esp_netif_get_handle_from_ifkey("WIFI_STA_DEF");
    esp_netif_ip_info_t ip = {};
    if (netif && esp_netif_get_ip_info(netif, &ip) == ESP_OK && ip.ip.addr != 0) {
        ESP_LOGI(TAG, "Web dashboard ready: http://" IPSTR "/",
                 IP2STR(&ip.ip));
    } else {
        ESP_LOGI(TAG,
                 "Web dashboard ready on port %u (waiting for a Wi-Fi IP address)",
                 (unsigned)WEB_PORT);
    }
    return ESP_OK;
}

esp_err_t WebDashboard::registerHandler(const char* uri,
                                        httpd_method_t method,
                                        esp_err_t (*handler)(httpd_req_t*)) {
    httpd_uri_t route = {};
    route.uri = uri;
    route.method = method;
    route.handler = handler;
    route.user_ctx = this;
    return httpd_register_uri_handler(server_, &route);
}

esp_err_t WebDashboard::registerHandlers() {
    esp_err_t err = ESP_OK;

    err = registerHandler("/", HTTP_GET, rootHandler);
    if (err != ESP_OK) return err;

    err = registerHandler("/api/status", HTTP_GET, statusHandler);
    if (err != ESP_OK) return err;

    err = registerHandler("/api/drive", HTTP_POST, driveHandler);
    if (err != ESP_OK) return err;

    err = registerHandler("/api/stop", HTTP_POST, stopHandler);
    if (err != ESP_OK) return err;

    err = registerHandler("/api/emotion", HTTP_POST, emotionHandler);
    if (err != ESP_OK) return err;

    err = registerHandler("/api/action", HTTP_POST, actionHandler);
    if (err != ESP_OK) return err;

    err = registerHandler("/api/look", HTTP_POST, lookHandler);
    if (err != ESP_OK) return err;

    err = registerHandler("/api/overlay", HTTP_POST, overlayHandler);
    if (err != ESP_OK) return err;

    err = registerHandler("/api/autonomy", HTTP_POST, autonomyHandler);
    if (err != ESP_OK) return err;

    return registerHandler("/api/display", HTTP_POST, displayHandler);
}

void WebDashboard::update() {
    if (!webDriving_) {
        return;
    }

    if ((uint32_t)(nowMs() - lastDriveMs_) > DRIVE_TIMEOUT_MS) {
        getMotorDriver().stop(true);
        webDriving_ = false;
        ESP_LOGW(TAG, "Remote drive lease expired - emergency braking");
    }
}

esp_err_t WebDashboard::rootHandler(httpd_req_t* req) {
    const size_t length = (size_t)(index_html_end - index_html_start);
    // EMBED_TXTFILES appends a NUL byte; do not send it.
    const size_t htmlLength = length > 0 ? length - 1 : 0;

    httpd_resp_set_type(req, "text/html; charset=utf-8");
    httpd_resp_set_hdr(req, "Cache-Control", "no-store");
    return httpd_resp_send(req, (const char*)index_html_start, htmlLength);
}

esp_err_t WebDashboard::statusHandler(httpd_req_t* req) {
    WebDashboard* self = dashboardFrom(req);
    if (!self || !self->face_) {
        return sendError(req, "503 Service Unavailable", "dashboard not ready");
    }

    wifi_ap_record_t ap = {};
    bool wifiConnected = esp_wifi_sta_get_ap_info(&ap) == ESP_OK;
    int rssi = wifiConnected ? ap.rssi : 0;

    char ipText[16] = "0.0.0.0";
    esp_netif_t* netif = esp_netif_get_handle_from_ifkey("WIFI_STA_DEF");
    if (netif) {
        esp_netif_ip_info_t ip = {};
        if (esp_netif_get_ip_info(netif, &ip) == ESP_OK && ip.ip.addr != 0) {
            snprintf(ipText, sizeof(ipText), IPSTR, IP2STR(&ip.ip));
        }
    }

    const MotorTelemetry& motor = getMotorDriver().getTelemetry();
    const uint16_t theme = self->face_->getTheme().primary;
    const unsigned red = ((theme >> 11) & 0x1F) * 255 / 31;
    const unsigned green = ((theme >> 5) & 0x3F) * 255 / 63;
    const unsigned blue = (theme & 0x1F) * 255 / 31;

    char body[1024];
    int written = snprintf(
        body, sizeof(body),
        "{\"ok\":true,\"uptime\":%lu,"
        "\"wifi\":{\"connected\":%s,\"rssi\":%d,\"ip\":\"%s\"},"
        "\"emotion\":%d,\"emotionName\":\"%s\",\"theme\":\"#%02x%02x%02x\","
        "\"auto\":%s,"
        "\"perf\":{\"fps\":%.1f,\"c1\":%.1f,\"c2\":%.1f,\"heap\":%lu},"
        "\"overlay\":{\"mode\":%d,\"position\":%d},"
        "\"display\":{\"brightness\":%u},"
        "\"motors\":{\"left\":%.2f,\"right\":%.2f,"
        "\"targetLeft\":%.2f,\"targetRight\":%.2f,"
        "\"throttle\":%.2f,\"steering\":%.2f,"
        "\"moving\":%s,\"braking\":%s},"
        "\"web\":{\"driving\":%s}}",
        (unsigned long)(esp_timer_get_time() / 1000000LL), boolStr(wifiConnected),
        rssi, ipText, (int)self->face_->getEmotion(),
        emotionName((int)self->face_->getEmotion()), red, green, blue,
        boolStr(self->face_->isAutonomousEnabled()),
        (double)self->face_->getFps(), (double)self->face_->getCpuCore1(),
        (double)self->face_->getCpuCore2(),
        (unsigned long)esp_get_free_heap_size(),
        (int)self->face_->getPerfOverlayMode(),
        (int)self->face_->getPerfOverlayPosition(),
        (unsigned)self->brightness_, (double)motor.currentLeft,
        (double)motor.currentRight, (double)motor.targetLeft,
        (double)motor.targetRight, (double)motor.throttle,
        (double)motor.steering, boolStr(motor.isMoving),
        boolStr(motor.isBraking), boolStr(self->webDriving_));

    if (written < 0 || (size_t)written >= sizeof(body)) {
        return sendError(req, "500 Internal Server Error", "status overflow");
    }
    return sendJson(req, body);
}

esp_err_t WebDashboard::driveHandler(httpd_req_t* req) {
    WebDashboard* self = dashboardFrom(req);
    if (!self) {
        return sendError(req, "503 Service Unavailable", "dashboard not ready");
    }

    float throttle = 0.0f;
    float steering = 0.0f;

    if (!queryFloat(req, "throttle", throttle) ||
        !queryFloat(req, "steering", steering)) {
        return sendError(req, "400 Bad Request",
                         "throttle and steering are required");
    }

    throttle = clampf(throttle, -1.0f, 1.0f);
    steering = clampf(steering, -1.0f, 1.0f);

    getMotorDriver().drive(throttle, steering);
    self->lastDriveMs_ = nowMs();
    self->webDriving_ =
        (std::fabs(throttle) > 0.001f || std::fabs(steering) > 0.001f);
    return sendOk(req);
}

esp_err_t WebDashboard::stopHandler(httpd_req_t* req) {
    WebDashboard* self = dashboardFrom(req);
    if (!self) {
        return sendError(req, "503 Service Unavailable", "dashboard not ready");
    }
    getMotorDriver().stop(true);
    self->webDriving_ = false;
    return sendOk(req);
}

esp_err_t WebDashboard::emotionHandler(httpd_req_t* req) {
    WebDashboard* self = dashboardFrom(req);
    if (!self || !self->face_) {
        return sendError(req, "503 Service Unavailable", "dashboard not ready");
    }

    int id = -1;
    int immediate = 0;
    if (!queryInt(req, "id", id)) {
        char name[24];
        if (!queryValue(req, "name", name, sizeof(name))) {
            return sendError(req, "400 Bad Request",
                             "id or name is required");
        }
        id = emotionIdFromName(name);
    }
    queryInt(req, "immediate", immediate);

    if (id < 0 || id >= (int)RobotEmotion::COUNT) {
        return sendError(req, "400 Bad Request", "unknown emotion");
    }

    // A manual expression is an explicit override; hold it instead of letting
    // autonomous drift replace it on the next control tick.
    self->face_->setAutonomousEnabled(false);
    self->face_->setEmotion((RobotEmotion)id, immediate != 0);
    return sendOk(req);
}

esp_err_t WebDashboard::actionHandler(httpd_req_t* req) {
    WebDashboard* self = dashboardFrom(req);
    if (!self || !self->face_) {
        return sendError(req, "503 Service Unavailable", "dashboard not ready");
    }

    char type[20];
    if (!queryValue(req, "type", type, sizeof(type))) {
        return sendError(req, "400 Bad Request", "type is required");
    }

    if (strcasecmp(type, "blink") == 0) {
        self->face_->triggerBlink();
    } else if (strcasecmp(type, "wink") == 0) {
        self->face_->setAutonomousEnabled(false);
        self->face_->triggerWink();
    } else if (strcasecmp(type, "next") == 0) {
        self->face_->setAutonomousEnabled(false);
        self->face_->nextEmotion();
    } else {
        return sendError(req, "400 Bad Request", "unknown action");
    }
    return sendOk(req);
}

esp_err_t WebDashboard::lookHandler(httpd_req_t* req) {
    WebDashboard* self = dashboardFrom(req);
    if (!self || !self->face_) {
        return sendError(req, "503 Service Unavailable", "dashboard not ready");
    }

    float x = 0.0f;
    float y = 0.0f;
    if (!queryFloat(req, "x", x) || !queryFloat(req, "y", y)) {
        return sendError(req, "400 Bad Request", "x and y are required");
    }

    self->face_->setAutonomousEnabled(false);
    self->face_->setLookAt(clampf(x, -1.0f, 1.0f),
                           clampf(y, -1.0f, 1.0f));
    return sendOk(req);
}

esp_err_t WebDashboard::overlayHandler(httpd_req_t* req) {
    WebDashboard* self = dashboardFrom(req);
    if (!self || !self->face_) {
        return sendError(req, "503 Service Unavailable", "dashboard not ready");
    }

    int mode = 0;
    int position = 0;
    bool hasMode = queryInt(req, "mode", mode);
    bool hasPosition = queryInt(req, "position", position);

    if (!hasMode && !hasPosition) {
        return sendError(req, "400 Bad Request",
                         "mode or position is required");
    }
    if (hasMode && (mode < 0 || mode >= (int)PerfOverlayMode::COUNT)) {
        return sendError(req, "400 Bad Request", "invalid overlay mode");
    }
    if (hasPosition &&
        (position < 0 || position > (int)PerfOverlayPosition::BottomRight)) {
        return sendError(req, "400 Bad Request", "invalid overlay position");
    }

    if (hasMode) {
        self->face_->setPerfOverlayMode((PerfOverlayMode)mode);
    }
    if (hasPosition) {
        self->face_->setPerfOverlayPosition((PerfOverlayPosition)position);
    }
    return sendOk(req);
}

esp_err_t WebDashboard::autonomyHandler(httpd_req_t* req) {
    WebDashboard* self = dashboardFrom(req);
    if (!self || !self->face_) {
        return sendError(req, "503 Service Unavailable", "dashboard not ready");
    }

    int enabled = 0;
    if (!queryInt(req, "enabled", enabled) ||
        (enabled != 0 && enabled != 1)) {
        return sendError(req, "400 Bad Request", "enabled must be 0 or 1");
    }

    self->face_->setAutonomousEnabled(enabled != 0);
    return sendOk(req);
}

esp_err_t WebDashboard::displayHandler(httpd_req_t* req) {
    WebDashboard* self = dashboardFrom(req);
    if (!self || !self->display_) {
        return sendError(req, "503 Service Unavailable", "dashboard not ready");
    }

    int value = 0;
    if (!queryInt(req, "value", value) || value < 0 || value > 255) {
        return sendError(req, "400 Bad Request",
                         "value must be between 0 and 255");
    }

    self->display_->setBrightness((uint8_t)value);
    self->brightness_ = (uint8_t)value;
    return sendOk(req);
}
