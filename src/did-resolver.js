import registerIpidResolver from 'ipid-did-resolver';
import resolveDid from 'did-resolver';
import Ipfs from 'ipfs';
import { UnavailableIpfsError } from './errors';

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

const setupDidResolver = async (options) => {
    const ipfsNode = await createIpfs(options.ipfs);

    registerIpidResolver(ipfsNode);

    return resolveDid;
};

export default setupDidResolver;
