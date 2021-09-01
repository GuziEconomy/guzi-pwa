const ec = new elliptic.ec('secp256k1');
const keypair = ec.genKeyPair();
console.log(keypair);

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
            s: "03aeb1e6bc2992602aaa916f5f8d1cc57a8b17fb0a06d0763c7fc9c7bb0bf4c7e6",
            g: 0, b: 0, t: 0,
        }

        const signedBlock = signblock();

        assert.deepEqual(block, expected);
    })
})
