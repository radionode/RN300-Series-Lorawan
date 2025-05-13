function decodeUplink(input) {
    const res = Decoder(input.bytes, input.fPort);
    if (res.error) {
      return { errors: [res.error] };
    }
    return { data: res };
  }

function Decoder(bytes, port) {
    const readUInt8 = b => b & 0xFF;
    const readUInt16LE = b => (b[1] << 8) + b[0];
    const readInt16LE = b => {
      const ret = readUInt16LE(b);
      return (ret > 0x7ffff) ? ret - 0x10000 : ret;
    }
    const readUInt32LE = b => (b[3] << 24) + (b[2] << 16) + (b[1] << 8) + b[0];
    const readInt32LE = b => {
      const ret = readUInt32LE(b);
      return (ret > 0x7FFFFFFF) ? ret - 0x100000000 : ret;
    }
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

    else if (head === 12 || head === 13 || head === 14) {
      // Sensor / Hold / Event
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

      if (ch_count < 3) {
        return { error: "Unsupported Sensor Data Size: " + ch_count };
      }

      temperature_01 = parseFloat(readFloatLE(data.slice(offset, offset + raw_size)).toFixed(2));
      if (temperature_01 <= -9999.0) temperature_01 = null;
      offset += raw_size;

      temperature_02 = parseFloat(readFloatLE(data.slice(offset, offset + raw_size)).toFixed(2));
      if (temperature_02 <= -9999.0) temperature_02 = null;
      offset += raw_size;

      door = parseFloat(readFloatLE(data.slice(offset, offset + raw_size)).toFixed(2));
      if (door <= -9999.0) door = null;
      // when door is open, the value is 99. when door is closed, the value is 0. others -9999.99

      return {
        head,
        model,
        tsmode,
        timestamp,
        splfmt,
        data_size,
        temperature1,
        temperature2,
        door
      };

    }

    return { error: "Unsupported head frame: " + head };
}
