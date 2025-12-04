#  How to Connect the RN-320 BTH LoRaWAN Sensor to Ubidots

---

##  Device Overview: Radionode RN320-BTH

The Radionode RN320 series is a robust, battery-operated wireless environmental sensor, professionally engineered for durability and extreme longevity, boasting an unbelievable **10-year battery life** (RN320-BTH model with 17,000mAh) facilitated by LoRaWAN technology for easy, wide-range network setup.

This specific RN320-BTH model:

*   Excels with an embedded **high-accuracy temperature and humidity sensor**.
*   Offers critical data protection via a retransmission function that prevents sample drops.
*   Includes permanent local storage on a **microSD card**.
*   Provides enhanced user interaction via an E-paper display, loud buzzer, and LED indicator.
*   Ensures quick access to comprehensive remote monitoring by simple QR code registration to the Radionode365 service.

##  Features of RN-320 BTH Device

*   **Long Range Wireless / LoRaWAN®**
*   High Accuracy Temperature & Humidity Sensor
*   E-Paper Display
*   Loud Buzzer (97dBA)
*   3 Color LED Indicator (Best, Moderate, Bad)
*   Long Battery Life (17000mAh)
*   MicroSD Card supported
*   Easy Installation with Magnet and Wall Bracket

##  Prerequisites

To continue with this guide, you will need the following:

*   RN320-BTH Temperature & Humidity Cloud Data Logger
*   LoRaWAN® gateway (in our case, the Radionode LoRaWAN Gateway)
*   Configured integration on network server
*   Network Server account (**The Things Stack**)
*   Ubidots Account

---

##  Device Connection & Setup

### 1. The Things Stack Community Setup

### 2. Register Application

The first step is to register in The Things Stack cloud console. Next, you will create an application.

**Steps to Create an Application:**

1.  Go to **The Things Stack console**.
2.  Open the **Applications** section.
3.  Press the **Add application** tab.
4.  Fill in the necessary **Application ID** and **Application Name**.
5.  **Create** the application.

![The Things Stack Community Edition Sign-in Screen](images/ubidots/ubi_Lora_1.png)

![The Things Stack Community Edition Sign-in Screen](images/ubidots/ubi_Lora_2.png)

##  Payload Decoder Setup

To ensure successful data transmission, both the device and the network server must be correctly configured. Our device submits data in **binary format**, which requires decoding.

We have two options for decoding the device data:

*   **The Things Stack Decoder:** Data will be decoded *before* entering Ubidots/Thingsboard (assuming Ubidots is the final platform).
*   **Thingsboard Converters:** Uplink/downlink converters will be used to decode data from binary format into JSON within the Thingsboard platform (if used as an intermediary).

### 1. Implementing the Payload Formatter in The Things Stack (Recommended)

In this documentation, we will explain how to add the payload formatters directly in The Things Stack (TTS) platform.

**Steps:**

1.  In your Application tab within the TTS console, locate and click the **Payload formatters** section.
2.  Select the **Uplink** option.
3.  Copy and paste the required payload formatter code (which should be provided below) into the editor.

![The Things Stack Community Edition Sign-in Screen](images/ubidots/ubi_Lora_3.png)



