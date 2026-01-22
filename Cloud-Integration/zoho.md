# How to connect the RN-320 BTH LoRaWAN Temperature and Humidity sensor to the Zoho platform?

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

![The Things Stack Community Edition Sign-in Screen](images/zoho/zoho_1.png)

![The Things Stack Community Edition Sign-in Screen](images/zoho/zoho_2.png)

##  Payload Decoder

To ensure successful data transmission, both the device and the network server must be correctly configured.

Our device submits data in **binary format**. We have two options to decode the device data:

*   **TheThingsStack decoder:** Data will be decoded before entering the Thingsboard.
*   **Thingsboard converters:** Uplink/downlink converters will be used to decode data from binary format into JSON.

In this documentation, we will explain how you have to add the payload formatters in the **TTN platform (The Things Network/Stack)**.

1.  In the Application tab, navigate to **Payload formatters**.
2.  Click on the **Uplink** option.
3.  Copy and paste the payload formatter we have given below into the provided field.


![The Things Stack Community Edition Sign-in Screen](images/zoho/zoho_3.png)

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

![The Things Stack Community Edition Sign-in Screen](images/zoho/zoho_4.png)


##  Registering the End Device

To register the end device, follow the steps below and enter the necessary details (as you would see them in the accompanying image):

1.  **Input Method:** Select the end device in the **LoRaWAN Device repository**.
    > **Note:** Radionode devices are already registered in The Things Stack platform for easy selection.
2.  **End Device Brand:** Choose the option `Dekist Co.Ltd`.
3.  **Model:** You can choose among the available **Radionode LoRaWAN models**.
4.  **Cluster Selection:** Choose the cluster where the device can be added.

![The Things Stack Community Edition Sign-in Screen](images/zoho/zoho_5.png)


##  Finalizing Device Registration

1.  Next, you need to enter the **DevEUI** correctly in the slot provided. You can find the **DevEUI** printed on the sticker located on the side of the physical device.
2.  After entering the **DevEUI**, add a unique **End Device ID** in the given slot.
3.  Once both are entered, complete the end device registration.

![The Things Stack Community Edition Sign-in Screen](images/zoho/zoho_6.png)

## Zoho Setup

After creating an account on the **Zoho IoT Platform**, log in to the Zoho dashboard.

The first step is to create an **Application**, as shown in the image below.  
Click on the **Create Application** tab to proceed.

![The Things Stack Community Edition Sign-in Screen](images/zoho/zoho_7.png)

After clicking the **Application** tab fill in the name of your application and click the create application button.

![The Things Stack Community Edition Sign-in Screen](images/zoho/zoho_8.png)


Once the application is created you can see a screen like it is shown below in the picture. Now click on the tab to create a new device.

![The Things Stack Community Edition Sign-in Screen](images/zoho/zoho_9.png)

After clicking add the device creation tab you can see different options to create a device.
Click the option add by defining your device product.

![The Things Stack Community Edition Sign-in Screen](images/zoho/zoho_10.png)


Add the required details as shown in the figure below. Provide a device name and other details as shown below.

![The Things Stack Community Edition Sign-in Screen](images/zoho/zoho_11.png)


Next you need to add the details like modelname, name of the device and the devUI from your LoRA device. In other fields you can retain the same details as shown in the figure.

![The Things Stack Community Edition Sign-in Screen](images/zoho/zoho_12.png)


After creating the device you will be seeing a screen as seen in the picture below.

![The Things Stack Community Edition Sign-in Screen](images/zoho/zoho_13.png)


After this you will be prompted to add if you have an IoT device or not. You can just click if you have got an IoT device.

![The Things Stack Community Edition Sign-in Screen](images/zoho/zoho_14.png)

Next we have to create the onboarding assistant. In the screen shown below, just click the option Add datastream.

![The Things Stack Community Edition Sign-in Screen](images/zoho/zoho_15.png)

After this in the next page, add the model (here The things stack), then add the data stream name and the Keep alive interval as shown in the figure below.

![The Things Stack Community Edition Sign-in Screen](images/zoho/zoho_16.png)

After this click the Associate Lorawan datastream option and click the name you gave in the previous step.

![The Things Stack Community Edition Sign-in Screen](images/zoho/zoho_17.png)

Then you will see a screen like this.

![The Things Stack Community Edition Sign-in Screen](images/zoho/zoho_18.png)



In the onboard lora data stream, if you click that you can find this screen as shown in the figure below. Copy the URL Param implementation from this page, we need to use this while creating the webhook in the Things stack platform.


![The Things Stack Community Edition Sign-in Screen](images/zoho/zoho_19.png)

## Creating webhook in the TTN Stack

Now in the TTN platform click the webhook option then the ADD option followed by choosing the Zoho option.


![The Things Stack Community Edition Sign-in Screen](images/zoho/zoho_20.png)

Give a name for the webhook, and paste the URL Param implementation copied while creating the device in the Zoho platform.

![The Things Stack Community Edition Sign-in Screen](images/zoho/zoho_21.png)

Once you create the webhook the device will be connected to things stack to receive data.

![The Things Stack Community Edition Sign-in Screen](images/zoho/zoho_22.png)


Once you click on the device tab, you can see all the details of the device. If you click the messages tab you can see the live and historic messages.

![The Things Stack Community Edition Sign-in Screen](images/zoho/zoho_23.png)



When you click the live messages, you can see a list of messages received by the device. Just click on one of the messages. You can see an image as shown below and the data variable name is needed for us to configure the parsing key while setting the datapoint configuration and to finally set up the dashboard. 

![The Things Stack Community Edition Sign-in Screen](images/zoho/zoho_24.png)



To access specific data from the sensor we need to create Datapoint configuration.Click the Actions tab and then Datapoint configuration. 


![The Things Stack Community Edition Sign-in Screen](images/zoho/zoho_25.png)


After entering the Datapoint configuration, do the settings as mentioned below. Click on the model template, and  add custom datapoint tabs and click proceed.

![The Things Stack Community Edition Sign-in Screen](images/zoho/zoho_26.png)

Then add the datapoint name, after this we need to set up the parsing key here.
![The Things Stack Community Edition Sign-in Screen](images/zoho/zoho_27.png)


Once you click the parsing key, just click direct parsing string and press the next button
![The Things Stack Community Edition Sign-in Screen](images/zoho/zoho_28.png)



After clicking the next button, you need to add the parsing key, taken from the earlier steps. For example here the parsing key is the decoded_data. Here we are creating the datapoint for humidity. So the parsing key should be decoded_data.humidity. Then finish the registration.

![The Things Stack Community Edition Sign-in Screen](images/zoho/zoho_29.png)


Finally you can see the data in the data explorer, after choosing the data points to view and choosing the chart type to see.

![The Things Stack Community Edition Sign-in Screen](images/zoho/zoho_30.png)

In the dashboard option, choose dashboard and give a name and choose the data points to display and the type of chart you need.

![The Things Stack Community Edition Sign-in Screen](images/zoho/zoho_31.png)

