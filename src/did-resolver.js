import registerIpidResolver from 'ipid-did-resolver';
import registerEthrDidToResolver from 'ethr-did-resolver';
import resolveDid from 'did-resolver';

import Ipfs from 'ipfs';
import { UnavailableIpfsError, UnavailableWeb3Error } from './errors';

const HttpProvider = require('ethjs-provider-http');
const WEB3_WEBSOCKET_ADDR = 'wss://rinkeby.infura.io/ws/v3/b94d9fecfb0f4d5697929ee98607c9f5';
const REGISTRY_ADDRESS = '0xdCa7EF03e98e0DC2B855bE647C39ABe984fcF21B';

const createIpfs = (ipfs) => {
    if (ipfs) {
        if (typeof ipfs.isOnline === 'function' && !ipfs.isOnline()) {
            throw new UnavailableIpfsError();
        }

        return ipfs;
    }

    return new Promise((resolve, reject) => {
        const node = new Ipfs({
            EXPERIMENTAL: {
                pubsub: true,
            },
            config: {
                Addresses: {
                    // WebSocket star possible servers:
                    // ws-star0.ams = "ws-star0.ams.dwebops.pub ws-star.discovery.libp2p.io"
                    // ws-star1.par = "ws-star1.par.dwebops.pub"
                    // ws-star2.sjc = "ws-star2.sjc.dwebops.pub"
                    Swarm: ['/dns4/ws-star1.par.dwebops.pub/tcp/443/wss/p2p-websocket-star'],
                },
            },
        });

        node.on('ready', () => resolve(node));
        node.on('error', (err) => reject(err));
    });
};

const createEthProvider = (web3, websocketAddress = WEB3_WEBSOCKET_ADDR) => new Promise((resolve, reject) => {
    try {
        if (web3) {
            if (typeof web3.sendAsync !== 'function') {
                throw new UnavailableWeb3Error();
            }

            return resolve(web3);
        }

        web3 = new HttpProvider(websocketAddress);

        return resolve(web3);
    } catch (err) {
        reject(err);
    }
});

const setupDidResolver = async (options, method) => {
    switch (method) {
    case 'ipid':
        await setupIpidResolver(options);
        break;

    case 'ethr':
        await setupEthrResolver(options);
        break;

    default:
        await setupIpidResolver(options);
    }

    return resolveDid;
};

const setupIpidResolver = async (options) => {
    const ipfsNode = await createIpfs(options.ipfs);

    registerIpidResolver(ipfsNode);
};

const setupEthrResolver = async (provider, websocketAddress) => {
    const newProvider = createEthProvider(provider, websocketAddress);

    registerEthrDidToResolver.default({
        newProvider,
        registry: REGISTRY_ADDRESS,
    });
};

export default setupDidResolver;
