# How to connect the RN-320 BTH LoRaWAN Temperature and Humidity sensor to the Data Cake?

The Radionode RN320 series is a robust, battery-operated wireless environmental sensor, professionally engineered for durability and extreme longevity, boasting an unbelievable 10-year battery life (RN320-BTH model with 17,000mAh) facilitated by LoRaWAN technology for easy, wide-range network setup. This specific RN320-BTH model excels with an embedded high-accuracy temperature and humidity sensor, critical data protection via a retransmission function that prevents sample drops, and permanent local storage on a microSD card. User interaction is enhanced by an E-paper display, loud buzzer, and LED indicator, while quick access to comprehensive remote monitoring is ensured by simple QR code registration to the Radionode365 service.

---

### Features of RN-320 BTH Device

*   Long Range Wireless / LoraWAN ®
*   High Accuracy Temperature & Humidity Sensor
*   E-Paper Display
*   Loud Buzzer 97dBA
*   3 Color LED Indicator (Best, Moderate, Bad)
*   Long Battery Life (17000mAh)
*   MicroSD Card supported
*   Easy Installation with Magnet and Wall Bracket

---

### Prerequisites

To continue with this guide we will need the following:

*   RN320-BTH Temperature & Humidity Cloud Data Logger
*   LoRaWAN® gateway (in our case Radionode LoRaWAN Gateway)
*   Configured integration on networks server
*   Network Server account (The Things Stack)
*   Data Cake Account

---

### Device connection

##  The Things Stack Community setup

### Register Application

The first step is to register in the Things stack cloud console. Next create an application in TheThingsStack console. Go to the console, open Applications section, press the add application tab and then fill the application ID, application name and then create the application.

![The Things Stack Community Edition Sign-in Screen](images/datacake/dc_Lora_1.png)

![The Things Stack Community Edition Sign-in Screen](images/datacake/dc_Lora_2.png)

##  Payload Decoder

To ensure successful data transmission, both the device and the network server must be correctly configured.

Our device submits data in **binary format**. We have two options to decode the device data:

*   **TheThingsStack decoder:** Data will be decoded before entering the Thingsboard.
*   **Thingsboard converters:** Uplink/downlink converters will be used to decode data from binary format into JSON.

In this documentation, we will explain how you have to add the payload formatters in the **TTN platform (The Things Network/Stack)**.

1.  In the Application tab, navigate to **Payload formatters**.
2.  Click on the **Uplink** option.
3.  Copy and paste the payload formatter we have given below into the provided field.


![The Things Stack Community Edition Sign-in Screen](images/datacake/dc_Lora_3.png)










