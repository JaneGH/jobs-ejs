const get_chai = require('./get_chai');
const app = require('../path/to/your/app'); 

describe('API Tests', () => {
    it('should return a 200 status', async () => {
        const { expect, request } = await get_chai();
        const res = await request(app)
            .get('/your-endpoint')
            .send();
        
        expect(res).to.have.status(200);
    });
});
