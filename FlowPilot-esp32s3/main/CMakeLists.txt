idf_component_register(SRCS "WebDashboard.cpp" "MotorTest.cpp" "PerfMonitor.cpp" "main.cpp" "RobotFace.cpp" "RgbLed.cpp" "MotorDriver.cpp"
                       INCLUDE_DIRS "."
                       EMBED_TXTFILES "web/index.html"
                       REQUIRES LovyanGFX esp_timer esp_driver_gpio esp_driver_ledc esp_driver_spi spi_flash freertos esp_hw_support espressif__led_strip hal esp_hal_pmu esp_wifi esp_event esp_netif nvs_flash esp_phy esp_http_server)
