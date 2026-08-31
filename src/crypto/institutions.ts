import { Institution } from '../types';

export const KNOWN_INSTITUTIONS: Institution[] = [
  {
    id: 'inst-stanford',
    name: 'Stanford University',
    code: 'STAN',
    domain: 'stanford.edu',
    logo: '🎓',
    accentColor: '#8C1D40', // Cardinal red
    publicKey: '04a1f8c942e5b778219087c91fa023e4451299dfb8c19984920485901baef4c1a2e3d4c5b6a7890123456789abcdef0123456789abcdef0123456789abcdef01',
    privateKey: 'stanford-auth-privkey-demo-2025-secp256k1-cardinal-secure',
    jurisdiction: 'California, United States',
    verifiedStatus: true,
  },
  {
    id: 'inst-mit',
    name: 'Massachusetts Institute of Technology',
    code: 'MIT',
    domain: 'mit.edu',
    logo: '🏛️',
    accentColor: '#A31F34',
    publicKey: '04b2c8d193e4f782019284d71ea094c4419208dfa7c18843910384710badf3b2b1c2d3e4f5a67890123456789abcdef0123456789abcdef0123456789abcdef02',
    privateKey: 'mit-auth-privkey-demo-2025-secp256k1-engineers-key',
    jurisdiction: 'Massachusetts, United States',
    verifiedStatus: true,
  },
  {
    id: 'inst-iitb',
    name: 'Indian Institute of Technology Bombay',
    code: 'IITB',
    domain: 'iitb.ac.in',
    logo: '📜',
    accentColor: '#0E4D92',
    publicKey: '04c3d9e284f5a893120395e82fb105d5520319efb8d29954021495821cbea4c3c2d3e4f5a67890123456789abcdef0123456789abcdef0123456789abcdef03',
    privateKey: 'iitb-auth-privkey-demo-2025-secp256k1-powai-secure',
    jurisdiction: 'Mumbai, India',
    verifiedStatus: true,
  },
  {
    id: 'inst-oxford',
    name: 'University of Oxford',
    code: 'OXF',
    domain: 'ox.ac.uk',
    logo: '🎖️',
    accentColor: '#002147',
    publicKey: '04d4e0f395a6b904231406f93ac216e6631420fac9e30065132506932dcfa5d4d3e4f5a67890123456789abcdef0123456789abcdef0123456789abcdef04',
    privateKey: 'oxford-auth-privkey-demo-2025-secp256k1-bodleian-key',
    jurisdiction: 'Oxford, United Kingdom',
    verifiedStatus: true,
  },
  {
    id: 'inst-gcp-academy',
    name: 'Google Cloud Certified Authority',
    code: 'GCP',
    domain: 'cloud.google.com',
    logo: '☁️',
    accentColor: '#4285F4',
    publicKey: '04e5f1a406b7c015342517a04bd327f7742531abd0f41176243617043edab6e5e4f5a67890123456789abcdef0123456789abcdef0123456789abcdef05',
    privateKey: 'gcp-auth-privkey-demo-2025-secp256k1-mountainview-root',
    jurisdiction: 'Global Authority, ISO/IEC 17024',
    verifiedStatus: true,
  }
];

export function getInstitutionById(id: string): Institution | undefined {
  return KNOWN_INSTITUTIONS.find(inst => inst.id === id);
}

export function getInstitutionByPublicKey(publicKey: string): Institution | undefined {
  return KNOWN_INSTITUTIONS.find(inst => inst.publicKey === publicKey);
}
