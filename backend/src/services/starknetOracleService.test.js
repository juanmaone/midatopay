const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const StarknetOracleService = require('./starknetOracleService');

describe('StarknetOracleService', () => {
  let oracleService;
  let mock;

  // These are the CORRECT selectors that the mock will expect.
  const correctSelectors = {
    'get_rate_ppm': '0x0042152386121e784381a17f694d6b633f837a242a353d9e4e6e66539a2d603a',
    'get_scale': '0x01824ff432446736c0a009401b2a9e33a6021e15b4d752f1e2925b0f1ed53802',
    'is_active': '0x02863920721764653e05908b98144b6118d0034a5d89e4722883492a54955a5b',
  };

  beforeEach(() => {
    oracleService = new StarknetOracleService();
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.restore();
  });

  describe('getCurrentRate', () => {
    it('should return the correct rate from the oracle', async () => {
      // Mock the RPC calls to the oracle contract
      const rate_ppm = '0x' + (1000 * 1000000).toString(16);
      const scale = '0x' + (1000000).toString(16);
      const isActive = '0x1';

      mock.onPost(oracleService.rpcUrl).reply((config) => {
        const data = JSON.parse(config.data);
        // The mock now checks for the CORRECT selectors
        if (data.params[0].entry_point_selector === correctSelectors['get_rate_ppm']) {
          return [200, { result: [rate_ppm] }];
        }
        if (data.params[0].entry_point_selector === correctSelectors['get_scale']) {
          return [200, { result: [scale] }];
        }
        if (data.params[0].entry_point_selector === correctSelectors['is_active']) {
          return [200, { result: [isActive] }];
        }
        // If the selector from the implementation is incorrect, the mock won't find a match and will return 500.
        return [500, {}];
      });

      const result = await oracleService.getCurrentRate();

      expect(result.actualRate).toBe(1000);
      expect(result.isActive).toBe(true);
    });
  });
});
