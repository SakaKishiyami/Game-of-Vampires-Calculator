// Book collection interfaces and data

export interface BookCollection {
  [bookName: string]: number;
}

export interface BooksState {
  Strength: BookCollection;
  Allure: BookCollection;
  Intellect: BookCollection;
  Spirit: BookCollection;
  Balanced: BookCollection;
}

// Initial book counts (all set to 0)
export const initialBooks: BooksState = {
  Strength: {
    "Warfare I": 0,
    "Warfare II": 0,
    "Warfare III": 0,
    "Warfare IV": 0,
    "Combat I": 0,
    "Combat II": 0
  },
  
  Allure: {
    "Glamor I": 0,
    "Glamor II": 0,
    "Glamor III": 0,
    "Glamor IV": 0,
    "Beauty I": 0,
    "Beauty II": 0
  },
  
  Intellect: {
    "Alchemy I": 0,
    "Alchemy II": 0,
    "Alchemy III": 0,
    "Alchemy IV": 0,
    "History I": 0,
    "History II": 0
  },
  
  Spirit: {
    "Occult I": 0,
    "Occult II": 0,
    "Occult III": 0,
    "Occult IV": 0,
    "Mysticism I": 0,
    "Mysticism II": 0
  },
  
  Balanced: {
    "Encyclopedia A-E": 0,
    "Encyclopedia A-J": 0,
    "Encyclopedia A-O": 0,
    "Encyclopedia A-T": 0,
    "Encyclopedia A-Z": 0,
    "Arcana I": 0,
    "Arcana II": 0
  }
};

// Book bonus values
export const bookBonuses = {
  Strength: {
    "Warfare I": 100,
    "Warfare II": 400,
    "Warfare III": 1000,
    "Warfare IV": 5000,
    "Combat I": 1500,
    "Combat II": 15000
  },
  
  Allure: {
    "Glamor I": 100,
    "Glamor II": 400,
    "Glamor III": 1000,
    "Glamor IV": 5000,
    "Beauty I": 1500,
    "Beauty II": 15000
  },
  
  Intellect: {
    "Alchemy I": 100,
    "Alchemy II": 400,
    "Alchemy III": 1000,
    "Alchemy IV": 5000,
    "History I": 1500,
    "History II": 15000
  },
  
  Spirit: {
    "Occult I": 100,
    "Occult II": 400,
    "Occult III": 1000,
    "Occult IV": 5000,
    "Mysticism I": 1500,
    "Mysticism II": 15000
  },
  
  Balanced: {
    "Encyclopedia A-E": 100,
    "Encyclopedia A-J": 400,
    "Encyclopedia A-O": 1000,
    "Encyclopedia A-T": 5000,
    "Encyclopedia A-Z": 10000,
    "Arcana I": 1500,
    "Arcana II": 15000
  }
};