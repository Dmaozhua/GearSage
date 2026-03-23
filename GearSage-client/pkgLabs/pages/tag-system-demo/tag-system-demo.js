Page({
  data: {
    // Mock Data for Demo
    rarityLevels: [
      { id: 1, name: 'NOVICE', rarity: 1, type: 'identity' },
      { id: 2, name: 'ANGLER', rarity: 2, type: 'identity' },
      { id: 3, name: 'PRO STAFF', rarity: 3, type: 'identity', icon: '★' },
      { id: 4, name: 'ELITE', rarity: 4, type: 'identity', icon: '♛' },
      { id: 5, name: 'LEGEND', rarity: 5, type: 'identity', icon: '♔' }
    ],
    
    // Different Categories (Types)
    categories: [
      { id: 101, name: 'Stream Angler', rarity: 2, type: 'identity', meta: 'Identity' },
      { id: 102, name: 'Active Contributor', rarity: 3, type: 'behavior', meta: 'Behavior' },
      { id: 103, name: 'Verified Author', rarity: 4, type: 'official', meta: 'Official' },
      { id: 104, name: 'Backyard Guardian', rarity: 1, type: 'fun', meta: 'Fun' }
    ],

    // Mock User for Profile Context
    userProfile: {
      name: 'RiverWalker',
      avatar: '/images/default-avatar.png',
      tags: [
        { name: 'PRO STAFF', rarity: 3, type: 'identity' },
        { name: 'BFS EXPERT', rarity: 4, type: 'identity' },
        { name: 'Verified', rarity: 4, type: 'official' }
      ]
    },

    // Mock Post for Feed Context
    postAuthor: {
      name: 'LureKing_99',
      tag: { name: 'VERIFIED', rarity: 2, type: 'official' }
    }
  },

  onLoad() {
    console.log('Tag System Lab Loaded');
  }
});
