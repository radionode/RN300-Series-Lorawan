/**
* message Decoder for The Things Network
*
 * Copyright 2024 DEKIST Co.,Ltd.
*
* @product RN320_PMT
* CH1_TAG						"PM2.5"
* CH2_TAG						"PM10"
* CH3_TAG						"LUX"
* CH4_TAG						"HCHO"
* CH5_TAG						"CO2"
* CH6_TAG						"CO"
* CH7_TAG						"TEMP"
* CH8_TAG						"HUMI"
*/

function Decoder(bytes, port) {
	/* ******************************************
	return payload
	********************************************/
	var message = {};
	message.Radionode_DX_v2_TTN = {};// radionode protocol ver 2.5
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

	/* ******************************************
	radionode payload protocols
	********************************************/
	var protocol = {}; //output of Radionode Dx Datain Protocol
	protocol.MAC = "DEV_EUI";// MAC이 존재 한다면 여기에 추가 / DEV_EUI로 보내면 DEV_EUI를 MAC으로 사용체크
	protocol.IP = -1;// IP 정보가 존재 한다면 여기에 추가 / -1로 보내면 0.0.0.0샛팅
	protocol.HISTORY = [];// 수회 측정 단일 전송 기능 사용시 C000을 제외 한 P001~데이터 저장

	protocol.HEAD = readUInt8LE(bytes[0]);
	protocol.MODEL = readUInt8LE(bytes[1]);
	switch (protocol.HEAD) {
		case 11 : // checkin
			protocol.VER = new Date((readUInt32LE(bytes.slice(2, 6)) * 1000)).toJSON().split('.')[0].replace('-', '').split('T')[0];
			protocol.INTERVAL = readUInt16LE(bytes.slice(6, 8));
			protocol.SPLRATE = readUInt16LE(bytes.slice(6, 8));
			protocol.BAT = readUInt8LE(bytes[8]);
			protocol.VOLT = "1|"+readUInt16LE(bytes.slice(9, 11))/1000;
			protocol.FREQBAND = readUInt8LE(bytes[11]);
			protocol.SUBBAND = readUInt8LE(bytes[12]);
		break;
		case 12 : // datain
		case 13 : // holddata
		case 14 : // event
			protocol.TSMODE = readUInt8LE(bytes[2]);
			protocol.TIMESTAMP = readUInt32LE(bytes.slice(3, 7));
			protocol.SPLFMT = readUInt8LE(bytes[7]);
			var raw_size = 4;
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
					var SS_NO = (i+1);
					var SS_VALUE = null;
					if( SS_NO > 6 ){ // 부호가 있는 정수 온,습도 7, 8 채널
						SS_VALUE = readInt16LE(ch_data.slice(offset,offset+raw_size));
						SS_VALUE = SS_VALUE * 0.01;
					}else{ // 부호가 없는 정수
						SS_VALUE = readUInt16LE(ch_data.slice(offset,offset+raw_size));
					}
					SS_VALUE = SS_VALUE.toFixed(2);
					if( parseInt(SS_VALUE) <= -9999 ) SS_VALUE = null;
					protocol["CH"+SS_NO] = SS_VALUE;
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