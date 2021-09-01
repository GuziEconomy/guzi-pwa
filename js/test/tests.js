const ec = new elliptic.ec('secp256k1');
// ({ "priv":"ed945716dddb7af2c9774939e9946f1fee31f5ec0a3c6ec96059f119c396912f",
// "pub":[
//     "c85e4e448d67a8dc724c620f3fe7d2a3a3cce9fe905b918f712396b4f8effcb3",
//     "ab1b8f3ba4816171fa61c3940f157d3136a786f03411cd5e19e0ba43d9104d60"
// ]});
const keypair = ec.keyFromPrivate("ed945716dddb7af2c9774939e9946f1fee31f5ec0a3c6ec96059f119c396912f", "hex");

QUnit.module('makeBirthBlock', () => {
    QUnit.test('Should return corectly filled block', (assert) => {
        const birthdate = "12/12/2002";
        const publicHexKey = "000000000000000000000000000000000000000000000000000000000000000000";

        const block = makeBirthBlock(birthdate, publicHexKey);

        const expected = {
            v: 1,
            d: birthdate,
            ph: "c1a551ca1c0deea5efea51b1e1dea112ed1dea0a5150f5e11ab1e50c1a15eed5",
            s: publicHexKey,
            g: 0, b: 0, t: 0,
        }

        assert.deepEqual(block, expected);
    })
})


QUnit.module('signblock', () => {
    QUnit.test('Should make valid signature', (assert) => {
        const block = {
            v: 1,
            d: "28/11/1989",
            ph: "c1a551ca1c0deea5efea51b1e1dea112ed1dea0a5150f5e11ab1e50c1a15eed5",
            s: "02c85e4e448d67a8dc724c620f3fe7d2a3a3cce9fe905b918f712396b4f8effcb3",
            g: 0, b: 0, t: 0,
        }

        const expected = {
            v: 1,
            d: "28/11/1989",
            ph: "c1a551ca1c0deea5efea51b1e1dea112ed1dea0a5150f5e11ab1e50c1a15eed5",
            s: "02c85e4e448d67a8dc724c620f3fe7d2a3a3cce9fe905b918f712396b4f8effcb3",
            g: 0, b: 0, t: 0,
            // h: "cd46dbbf4deef70d7519f3e5dc825311bd0935c958571f87e399a860d1aac5cd",
            h: "3045022100fa8fa6d39457649ba21cca129ec6c3b41bb2dbb4247dd47a5491cb3567fad5d30220434ef707b7a044e05646a564445a279e4ffab7b00a9649e8a2d7fce165c3a8ad"
        }

        const signedBlock = signblock(block);

        assert.deepEqual(block, expected);
    })
})

