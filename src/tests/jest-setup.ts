import { TextDecoder, TextEncoder } from 'util';

const global = window as any;
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

window.MessageChannel = jest.fn().mockImplementation(() => {
  let onmessage: any;
  return {
    port1: {
      set onmessage(cb: any) {
        onmessage = cb;
      },
    },
    port2: {
      postMessage: (data: any) => {
        onmessage?.({ data });
      },
    },
  };
});
