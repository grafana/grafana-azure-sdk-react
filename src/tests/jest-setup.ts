import { TextEncoder, TextDecoder } from 'util';

const global = window as any;
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
