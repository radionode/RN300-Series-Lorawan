/**
* Payload Decoder
*
 * Copyright 2024 Radionode
*
* @product RN320_EX2 Temp/RH

*/
function Decoder(bytes, port) {
	/* ******************************************
	return payload
	********************************************/
	var message = {};
	message.Radionode_DX_v2_TTN = {};
	message.Radionode_DX_v2_TTN.Uplink = {};

	/* ******************************************
	bytes to number
	********************************************/
	var readUInt8LE = function(bytes) {
		return (bytes & 0xFF);
	}
	var readInt8LE = function(bytes) {
		var ref = readUInt8LE(bytes);
		return (ref > 0x7F) ? ref - 0x100 : ref;
	}

	var readUInt16LE = function(bytes) {
		var value = (bytes[1] << 8) + bytes[0];
		return (value & 0xFFFF);
	}
	var readInt16LE = function(bytes) {
		var ref = readUInt16LE(bytes);
		return (ref > 0x7FFF) ? ref - 0x10000 : ref;
	}

	var readUInt32LE = function(bytes) {
		var value = (bytes[3] << 24) + (bytes[2] << 16) + (bytes[1] << 8) + bytes[0];
		return (value & 0xFFFFFFFF);
	}
	var readInt32LE = function(bytes) {
		var ref = readUInt32LE(bytes);
		return (ref > 0x7FFFFFFF) ? ref - 0x100000000 : ref;
	}

	var readFloatLE = function(bytes) { // JavaScript bitwise operators yield a 32 bits integer, not a float. // Assume LSB (least significant byte first). 
		var bits = bytes[3] << 24 | bytes[2] << 16 | bytes[1] << 8 | bytes[0];
		var sign = (bits >>> 31 === 0) ? 1.0 : -1.0;
		var e = bits >>> 23 & 0xff;
		var m = (e === 0) ? (bits & 0x7fffff) << 1 : (bits & 0x7fffff) | 0x800000;
		var f = sign * m * Math.pow(2, e - 150);
		return f;
	}

	/* ******************************************
	radionode payload protocols
	********************************************/
	var protocol = {}; //output of Radionode Dx Datain Protocol

    // Device MAC address (optional: set for each device using DEV_EUI)
	protocol.MAC = "DEV_EUI";
    // Default IP address (0.0.0.0)
	protocol.IP = -1;
    // Stores measurement data for P001 and onwards
	protocol.HISTORY = [];

	// Protocol header, indicates start (0x0B)
	protocol.HEAD = readUInt8LE(bytes[0]);
    // Device model number index (BYTE: 0~255)
	protocol.MODEL = readUInt8LE(bytes[1]);
	switch (protocol.HEAD) {
		case 11 : // checkin
            //Firmware version 
			protocol.VER = new Date((readUInt32LE(bytes.slice(2, 6)) * 1000)).toJSON().split('.')[0].replace('-', '').split('T')[0];
            // Data transmission interval
			protocol.INTERVAL = readUInt16LE(bytes.slice(6, 8));
            // Sensor model number
            protocol.SPLRATE = readUInt16LE(bytes.slice(6, 8));
			// Indicates the battery status. (0 = DC, 5 = Replace battery)
            protocol.BAT = readUInt8LE(bytes[8]);
            // Battery status (in mV)
			protocol.VOLT = readUInt16LE(bytes.slice(9, 11))/1000;
            // Frequency band configuration (LoRaWAN region)
			protocol.FREQBAND = readUInt8LE(bytes[11]);
            // Sub-band configuration
			protocol.SUBBAND = readUInt8LE(bytes[12]);
		break;
		case 12 : // datain
		case 13 : // holddata
		case 14 : // event
            // Timestamp format (0: Unix, 1: Radionode Timestamp)
			protocol.TSMODE = readUInt8LE(bytes[2]); 
           // Sample measurement time (timestamp)
			protocol.TIMESTAMP = readUInt32LE(bytes.slice(3, 7));
           //RN320-EX2 Sample format (e.g., float sensor data)
			protocol.SPLFMT = readUInt8LE(bytes[7]);
			var raw_size = 8;
			var ch_data = bytes.slice(8);
			var data_size = ch_data.length;
			var ch_count = data_size/raw_size;
			switch (protocol.SPLFMT) {
				case 1: raw_size = 2; break;
				case 2: raw_size = 4; break;
				case 3: raw_size = 8; break;
				default : //error
					return { payload: "Frame SPLFMT check failed." };
			}			
			var ch_data = bytes.slice(8);
			var data_size = ch_data.length;
			protocol.DATA_SIZE = data_size;

			var ch_count = data_size/raw_size;
			if( ch_count > 0 ){
				var offset = 0;
				for (var i = 0; i < ch_count; i++ ) {
					protocol["CH"+(i+1)] = readFloatLE(ch_data.slice(offset,offset+raw_size)).toFixed(2);
					if( protocol["CH"+(i+1)] == "-9999.90" ) protocol["CH"+(i+1)] = null;
					offset += raw_size;
				}
			}
		break;
		default : //error
			return { payload: "Frame CRC check failed." };
	}
	message.Radionode_DX_v2_TTN.Uplink = protocol;

	/* ******************************************
	Return data, format of decode payload
	Decoder(bytes, port) : return { payload: message };
	decodeUplink(input) : return { data { payload: message } }; input.bytes, input.port
	********************************************/
	return { payload: message };
}
