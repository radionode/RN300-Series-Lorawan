
This guide explains how to connect the **RN-320 BTH LoRaWAN Temperature and Humidity sensor** to the **Thinger.io** platform.

The **Radionode RN320 series** is a robust, battery-operated wireless environmental sensor, professionally engineered for durability and extreme longevity, boasting an unbelievable **10-year battery life** (RN320-BTH model with 17,000mAh) facilitated by LoRaWAN technology for easy, wide-range network setup.

This specific RN320-BTH model excels with an **embedded high-accuracy temperature and humidity sensor**, critical data protection via a retransmission function that prevents sample drops, and permanent local storage on a **microSD card**. User interaction is enhanced by an **E-paper display**, **loud buzzer (97dBA)**, and a **3-Color LED indicator** (Best, Moderate, Bad), while quick access to comprehensive remote monitoring is ensured by simple QR code registration to the Radionode365 service. It also offers easy installation with a magnet and wall bracket.

---

## Prerequisites

To continue with this guide, you will need the following:

* **RN320-BTH** Temperature & Humidity Cloud Data Logger
* **LoRaWAN® gateway** (e.g., Radionode LoRaWAN Gateway)
* Configured integration on a networks server and ThingsBoard
* **Network Server account** (The Things Stack)
* **Thinger.io account** 

---

## Device Connection: The Things Stack Community Setup

### Register Application

The first step is to register in the **The Things Stack** cloud console. Next, create an application in The Things Stack console.

1.  Go to the console and open the **Applications** section.
    ![The Things Stack Community Edition Sign-in Screen](images/thingerio/Thinger_Lora_1.png)
2.  Press the **Add application** tab and then fill in the **Application ID** and **Application Name**.
3.  Click **Create application**.
    ![The Things Stack Create Application Page](images/thingerio/Thinger_Lora_2.png)

### Payload Decoder

To ensure successful data transmission, both the device and the network server must be correctly configured. Our device submits data in **binary format**.

In this documentation, we explain how to add the payload formatters in the TTN platform.

1.  In the application tab, click on **Payload formatters** and select the **Uplink** option.
2.  Copy and paste the payload formatter code below into the editor.
    ![The Things Stack Payload Formatters Uplink Menu](images/thingerio/Thinger_Lora_3.png)

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

##  End Device Registration in The Things Stack (TTS)

The next crucial step is **End Device creation** within The Things Stack (TTS).

1.  Open the **Devices** page in your TTS console.
2.  Press the **Register device** tab.

  ![The Things Stack Payload Formatters Uplink Menu](images/thingerio/Thinger_Lora_4.png)

##  Enter End Device Details

To successfully register the End Device, enter the following details, as illustrated in the image below:

*   **Input Method**: Select **The end device in the LoRaWAN Device repository**.
    > (Radionode devices are typically pre-registered in The Things Stack platform.)
*   **End Device Brand**: Choose **Dekist Co.Ltd**.
*   **Model**: Select the appropriate **Radionode LoRaWAN model** from the list.
*   **Cluster**: Choose the **cluster** where this device should be added.

 ![The Things Stack Payload Formatters Uplink Menu](images/thingerio/Thinger_Lora_5.png)

##  Enter Device Identifiers

Next, we need to correctly enter the **DevEUI** in the designated field.

*   You can typically find the **DevEUI** printed on the sticker located on the side of the physical device.

After entering the **DevEUI**, proceed as follows:

1.  Add a unique **End Device ID** in the slot provided.
2.  Complete the end device registration process.

  ![The Things Stack Payload Formatters Uplink Menu](images/thingerio/Thinger_Lora_6.png)

  ##  Thinger.io Setup

### 1. Account Registration

First, **register an account** on the **thinger.io platform**.

---

### 2. Create the The Things Stack Plugin

The first step within Thinger.io is to create a **plugin** for The Things Stack platform:

1.  Navigate to the **Plugins** tab.
2.  Click the plugin option (as shown in the accompanying picture).

  ![The Things Stack Payload Formatters Uplink Menu](images/thingerio/Thinger_Lora_7.png)
  
##  Plugin Configuration Details

You will be prompted to input an **Application ID** and a **Device ID prefix** (as shown in the accompanying image).

### Application ID Note

The **Application ID** you enter **must exactly match** the Application ID defined in The Things Network (TTN) Console. The Thinger.io plugin uses this value to route outgoing requests to the correct TTN application.

### Important: Keep This Page Open!

You will need two pieces of information generated by the plugin for the next step:

*   The **Webhook URL**
*   The **TTN TOKEN**
  
 ![The Things Stack Payload Formatters Uplink Menu](images/thingerio/Thinger_Lora_8.png)

##  TTN Webhook Configuration

### 1. Log In and Select Application

First, **log in to The Things Network (TTN) Console** and select the target **Application**.

### 2. Add New Webhook

Navigate to the following section: **Integrations** $\rightarrow$ **Webhooks**, and then click **Add Webhooks**.


### 3. Complete the Webhook Form

*   Choose the **Thinger.io Template**.
*   Complete the form using the **Webhook URL** and **TTN TOKEN** you obtained from your Thinger.io plugin settings.
 
 ![The Things Stack Payload Formatters Uplink Menu](images/thingerio/Thinger_Lora_9.png)

 ### Webhook Configuration Fields

| Template Field | Value |
| :--- | :--- |
| **Webhook ID** | Your preferred webhook ID |
| **Thinger.io instance** | Your Thinger.io instance domain (e.g., `acme.thinger.io` or `console.thinger.io`) |
| **Thinger.io user** | Your Thinger.io username |
| **Authorization Header** | Your Thinger.io **TTN API TOKEN** |
| **Plugin Endpoint** | Plugin endpoint (leave default value if using this plugin) |


> 💡 **Where to find the Token:**
> You can find your **TTN API TOKEN** in the plugin settings page, under the dedicated `TTN API TOKEN` field.

 ![The Things Stack Payload Formatters Uplink Menu](images/thingerio/Thinger_Lora_10.png)

 Just click the **"copy"** button and paste it into the **Authorization Header** field in the TTN Console.

  ![The Things Stack Payload Formatters Uplink Menu](images/thingerio/Thinger_Lora_11.png)

##  Product Template in Thinger.io

### Creating a product template in Thinger.io

The next step is to create a product template in the platform for our **RN320-BTH** device.

 ![The Things Stack Payload Formatters Uplink Menu](images/thingerio/Thinger_Lora_12.png)

 Do the settings in the product template similar to the Images shown below:

*   **Properties**
*   **Buckets**
*   **API resources**
*   **Auto Provision**
*   **Product Script**

   ![The Things Stack Payload Formatters Uplink Menu](images/thingerio/Thinger_Lora_13.png)

    ![The Things Stack Payload Formatters Uplink Menu](images/thingerio/Thinger_Lora_14.png)


    Add this javascript code in the product template

    ```javascript
    // Device Identifier Resolver
function getId(payload) {
    return payload.deviceId;
}

// Custom payload processing para rn320device_data 
function decode_data(payload) { 
    let decoded = payload.decodedPayload;

    // Ignore the head 11 and 13
    if (decoded.head == '11' || decoded.head == '13') { 
        return null;
    }

    // Save the rest of the heads in the bucket
    return decoded;
}

function decodeHearbeatUplink(payload) {
  let decoded = payload.decodedPayload;
  if (payload.decodedPayload.head != '11') {
    return null;
  }
  return decoded;
}
  ```

Once the communication is enabled, the device will be created as we have enabled **auto-provisioning**.

 ![The Things Stack Payload Formatters Uplink Menu](images/thingerio/Thinger_Lora_15.png)

In the device settings, you can create a dashboard using the **widgets** options.

> Here is a sample of the dashboard created in the thinger platform.

![The Things Stack Payload Formatters Uplink Menu](images/thingerio/Thinger_Lora_16.png)
