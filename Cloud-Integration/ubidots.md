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

```javascript
function decodeUplink(input) {
  const res = Decoder(input.bytes, input.fPort);
  if (res.error) {
    return { errors: [res.error] };
  }
  return { data: res };
}

function Decoder (bytes, port) {
  const readUInt8 = b => b & 0xFF;
  const readUInt16LE = b => (b[1] << 8) + b[0];
  const readInt16LE = b => {
    const ret = readUInt16LE(b);
    return (ret > 0x7FFF) ? ret - 0x10000 : ret;
  };
  const readUInt32LE = b => (b[3] << 24) + (b[2] << 16) + (b[1] << 8) + b[0];
  const readInt32LE = b => {
    const ret = readUInt32LE(b);
    return (ret > 0x7FFFFFFF) ? ret - 0x100000000 : ret;
  };
  const readFloatLE = b => {
    const buf = new ArrayBuffer(4);
    const view = new DataView(buf);
    for (let i = 0; i < 4; i++) view.setUint8(i, b[i]);
    return view.getFloat32(0, true); // ieee754 float
  };

  const head = readUInt8(bytes[0]);
  const model = readUInt8(bytes[1]);

  if (head === 11) {
    // Check-in frame
    const timestamp = readUInt32LE(bytes.slice(2, 6));
    const date = new Date(timestamp * 1000);
    const yyyy = date.getUTCFullYear();
    const mm = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const dd = date.getUTCDate().toString().padStart(2, '0');
    const verFormatted = parseInt(`${yyyy}${mm}${dd}`);
    const interval = readUInt16LE(bytes.slice(6, 8));
    const splrate = interval;
    const bat = readUInt8(bytes[8]);
    const millivolt = readUInt16LE(bytes.slice(9, 11));
    const volt = (millivolt / 1000).toFixed(3);
    const freqband = readUInt8(bytes[11]);
    const subband = readUInt8(bytes[12]);

    return {
      head,
      ver: verFormatted,
      interval,
      splrate,
      bat,
      volt,
      freqband,
      subband
    };
  }
  else if (head === 12 || head === 13) {
    // Sensor / Hold
    const tsmode = readUInt8(bytes[2]);
    const timestamp = readUInt32LE(bytes.slice(3, 7));
    const splfmt = readUInt8(bytes[7]);
    
    if (splfmt !== 2) {
      return { error: "Unsupported Sensor Data Format: " + splfmt };
    }

    const raw_size = 4;
    const data = bytes.slice(8);
    const ch_count = data.length / raw_size;
    const data_size = data.length;
    let offset = 0;
    let temperature = null, humidity = null;

    if (ch_count < 2) {
      return { error: "Unsupported Sensor Data Size:" + ch_count };
    }

    temperature = parseFloat(readFloatLE(data.slice(offset, offset + raw_size)).toFixed(2));
    if (temperature <= -9999.0) temperature = null;
    offset += raw_size;

    humidity = parseFloat(readFloatLE(data.slice(offset, offset + raw_size)).toFixed(2));
    if (humidity <= -9999.0) humidity = null;

    return {
      head,
      model,
      tsmode,
      timestamp,
      splfmt,
      data_size,
      temperature,
      humidity
    };
  }

  return { error: "Unsupported head frame: " + head };
}
```



