import React, { useState, useMemo, useEffect } from 'react';
import { useServerTime } from '../context/ServerTimeContext';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Tag, 
  Clock, 
  Info, 
  PartyPopper,
  Filter,
  Download,
  X,
  Bookmark,
  Search,
  Grid,
  List,
  RotateCcw,
  Copy,
  Check,
  CheckCircle2,
  CalendarDays
} from 'lucide-react';

// Helper to compute 2nd and 4th Saturday Weekend Offs for any year
const getWeekendOffSaturdays = (year = 2026) => {
  const list = [];
  let idCounter = 100;
  for (let m = 0; m < 12; m++) {
    let satCount = 0;
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, m, d);
      if (dateObj.getDay() === 6) {
        satCount++;
        if (satCount === 2 || satCount === 4) {
          const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const label = satCount === 2 ? '2nd Saturday (Weekend Off)' : '4th Saturday (Weekend Off)';
          list.push({
            id: idCounter++,
            date: dateStr,
            title: label,
            name: label,
            category: 'Weekend Off',
            type: 'Weekend Off',
            day: 'Saturday',
            desc: `Official Govt of Assam ${satCount === 2 ? '2nd' : '4th'} Saturday weekend off holiday.`
          });
        }
      }
    }
  }
  return list;
};

// Comprehensive Official Assam Government (GAD) Holiday Notification Roster 2026 (e-file No. 221561/440)
const OFFICIAL_GAD_HOLIDAYS_2026 = [
  // GAZETTED HOLIDAYS (35 Items) - Section 1
  { id: 1, date: '2026-01-14', name: 'Magh Bihu & Tusu Puja', title: 'Magh Bihu & Tusu Puja', type: 'Gazetted', category: 'Gazetted', day: 'Wednesday', desc: 'Assam harvest festival and Tusu Puja celebrations.' },
  { id: 2, date: '2026-01-15', name: 'Magh Bihu', title: 'Magh Bihu', type: 'Gazetted', category: 'Gazetted', day: 'Thursday', desc: 'Traditional harvest festival celebrated across Assam.' },
  { id: 3, date: '2026-01-23', name: "Netaji's Birthday", title: "Netaji's Birthday", type: 'Gazetted', category: 'Gazetted', day: 'Friday', desc: 'Birth anniversary of Netaji Subhas Chandra Bose.' },
  { id: 4, date: '2026-01-26', name: 'Republic Day', title: 'Republic Day', type: 'Gazetted', category: 'Gazetted', day: 'Monday', desc: 'National holiday commemorating the adoption of the Constitution of India.' },
  { id: 5, date: '2026-01-27', name: 'Gwthar Bathou San', title: 'Gwthar Bathou San', type: 'Gazetted', category: 'Gazetted', day: 'Tuesday', desc: 'Traditional Bathou religious and cultural observance.' },
  { id: 6, date: '2026-01-31', name: 'Me-Dam-Me-Phi', title: 'Me-Dam-Me-Phi', type: 'Gazetted', category: 'Gazetted', day: 'Saturday', desc: 'Ahom ancestor worship festival observed in Assam.' },
  { id: 7, date: '2026-02-01', name: 'Bir Chilaray Divas', title: 'Bir Chilaray Divas', type: 'Gazetted', category: 'Gazetted', day: 'Sunday', desc: 'Day commemorating the legendary Koch general Bir Chilaray.' },
  { id: 8, date: '2026-03-03', name: 'Dol Jatra', title: 'Dol Jatra', type: 'Gazetted', category: 'Gazetted', day: 'Tuesday', desc: 'Festival of colours and traditional Dol Jatra celebrations.' },
  { id: 9, date: '2026-03-21', name: 'Id-Ul-Fitr', title: 'Id-Ul-Fitr', type: 'Gazetted', category: 'Gazetted', day: 'Saturday', desc: 'Festival marking the conclusion of Ramadan.' },
  { id: 10, date: '2026-04-03', name: 'Good Friday', title: 'Good Friday', type: 'Gazetted', category: 'Gazetted', day: 'Friday', desc: 'Christian observance commemorating the crucifixion of Jesus Christ.' },
  { id: 11, date: '2026-04-14', name: 'Bohag Bihu', title: 'Bohag Bihu', type: 'Gazetted', category: 'Gazetted', day: 'Tuesday', desc: 'Assamese New Year and beginning of Rongali Bihu celebrations.' },
  { id: 12, date: '2026-04-15', name: 'Bohag Bihu (Day 2)', title: 'Bohag Bihu (Day 2)', type: 'Gazetted', category: 'Gazetted', day: 'Wednesday', desc: 'Second day of the official Bohag Bihu celebrations.' },
  { id: 13, date: '2026-04-16', name: 'Bohag Bihu (Day 3)', title: 'Bohag Bihu (Day 3)', type: 'Gazetted', category: 'Gazetted', day: 'Thursday', desc: 'Third day of the official Bohag Bihu celebrations.' },
  { id: 14, date: '2026-04-18', name: 'Tithi of Damodar Deva', title: 'Tithi of Damodar Deva', type: 'Gazetted', category: 'Gazetted', day: 'Saturday', desc: 'Commemoration of the Tithi of Vaishnavite saint Damodar Deva.' },
  { id: 15, date: '2026-04-21', name: 'Sati Sadhini Divas', title: 'Sati Sadhini Divas', type: 'Gazetted', category: 'Gazetted', day: 'Tuesday', desc: 'Day commemorating Sati Sadhini and her historical legacy.' },
  { id: 16, date: '2026-05-01', name: 'May Day & Budha Purnima', title: 'May Day & Budha Purnima', type: 'Gazetted', category: 'Gazetted', day: 'Friday', desc: "International Workers' Day and Buddha Purnima." },
  { id: 17, date: '2026-05-27', name: 'Id-ul-Zuha', title: 'Id-ul-Zuha', type: 'Gazetted', category: 'Gazetted', day: 'Wednesday', desc: 'Eid al-Adha, the Islamic festival of sacrifice (Govt of Assam GAD Notified).' },
  { id: 18, date: '2026-06-01', name: 'Janmotsav of Sri Sri Madhabdeva', title: 'Janmotsav of Sri Sri Madhabdeva', type: 'Gazetted', category: 'Gazetted', day: 'Monday', desc: 'Birth anniversary celebration of Vaishnavite saint Sri Sri Madhabdeva.' },
  { id: 19, date: '2026-08-15', name: 'Independence Day', title: 'Independence Day', type: 'Gazetted', category: 'Gazetted', day: 'Saturday', desc: "National holiday commemorating India's independence." },
  { id: 20, date: '2026-09-01', name: 'Tirubhav Tithi of Sri Sri Madhabdeva', title: 'Tirubhav Tithi of Sri Sri Madhabdeva', type: 'Gazetted', category: 'Gazetted', day: 'Tuesday', desc: 'Commemoration of the Tirubhav Tithi of Sri Sri Madhabdeva.' },
  { id: 21, date: '2026-09-04', name: 'Janmastomi', title: 'Janmastomi', type: 'Gazetted', category: 'Gazetted', day: 'Friday', desc: 'Festival celebrating the birth of Lord Krishna.' },
  { id: 22, date: '2026-09-12', name: 'Tirubhav Tithi of Srimanta Sankardeva', title: 'Tirubhav Tithi of Srimanta Sankardeva', type: 'Gazetted', category: 'Gazetted', day: 'Saturday', desc: 'Commemoration of the passing anniversary of Srimanta Sankardeva.' },
  { id: 23, date: '2026-09-21', name: 'Janmotsav of Srimanta Sankardeva', title: 'Janmotsav of Srimanta Sankardeva', type: 'Gazetted', category: 'Gazetted', day: 'Monday', desc: 'Birth anniversary celebration of Srimanta Sankardeva.' },
  { id: 24, date: '2026-09-22', name: 'Karam Puja', title: 'Karam Puja', type: 'Gazetted', category: 'Gazetted', day: 'Tuesday', desc: 'Traditional Karam Puja festival observed by communities across Assam.' },
  { id: 25, date: '2026-10-02', name: 'Birthday of Mahatma Gandhi', title: 'Birthday of Mahatma Gandhi', type: 'Gazetted', category: 'Gazetted', day: 'Friday', desc: 'Birth anniversary of Mahatma Gandhi and national holiday.' },
  { id: 26, date: '2026-10-18', name: 'Kati Bihu & Durga Puja', title: 'Kati Bihu & Durga Puja', type: 'Gazetted', category: 'Gazetted', day: 'Sunday', desc: 'Kati Bihu observance and Durga Puja festival.' },
  { id: 27, date: '2026-10-19', name: 'Durga Puja & Vijaya Dashomi', title: 'Durga Puja & Vijaya Dashomi', type: 'Gazetted', category: 'Gazetted', day: 'Monday', desc: 'Durga Puja and Vijaya Dashomi celebrations.' },
  { id: 28, date: '2026-10-20', name: 'Durga Puja (Day 3)', title: 'Durga Puja (Day 3)', type: 'Gazetted', category: 'Gazetted', day: 'Tuesday', desc: 'Durga Puja festival holiday.' },
  { id: 29, date: '2026-10-21', name: 'Durga Puja (Day 4)', title: 'Durga Puja (Day 4)', type: 'Gazetted', category: 'Gazetted', day: 'Wednesday', desc: 'Durga Puja festival holiday.' },
  { id: 30, date: '2026-11-08', name: 'Kali Puja & Diwali', title: 'Kali Puja & Diwali', type: 'Gazetted', category: 'Gazetted', day: 'Sunday', desc: 'Festival of lights and Kali Puja celebrations.' },
  { id: 31, date: '2026-11-11', name: 'Bhatri Dwitiya', title: 'Bhatri Dwitiya', type: 'Gazetted', category: 'Gazetted', day: 'Wednesday', desc: 'Traditional festival celebrating the bond between brothers and sisters.' },
  { id: 32, date: '2026-11-15', name: 'Chhath Puja', title: 'Chhath Puja', type: 'Gazetted', category: 'Gazetted', day: 'Sunday', desc: 'Traditional Hindu festival dedicated to the worship of the Sun.' },
  { id: 33, date: '2026-11-24', name: "Guru Nanak's Birthday & Lachit Divas", title: "Guru Nanak's Birthday & Lachit Divas", type: 'Gazetted', category: 'Gazetted', day: 'Tuesday', desc: 'Birth anniversary of Guru Nanak and Lachit Divas commemorating Lachit Borphukan.' },
  { id: 34, date: '2026-12-02', name: 'Asom Divas (Su-Ka-Pha Divas)', title: 'Asom Divas (Su-Ka-Pha Divas)', type: 'Gazetted', category: 'Gazetted', day: 'Wednesday', desc: 'Commemorates Chaolung Sukaphaa, founder of the Ahom Kingdom.' },
  { id: 35, date: '2026-12-25', name: 'Christmas Day', title: 'Christmas Day', type: 'Gazetted', category: 'Gazetted', day: 'Friday', desc: 'Christmas Day celebrations.' },

  // HALF HOLIDAY (1 Item) - Section 2
  { id: 36, date: '2026-10-25', name: 'Lakshmi Puja', title: 'Lakshmi Puja', type: 'Half Holiday', category: 'Half Holiday', day: 'Sunday', desc: 'Lakshmi Puja; offices and courts remain closed after 1 P.M.' },

  // RESTRICTED HOLIDAYS (39 Items) - Section 5
  { id: 37, date: '2026-01-01', name: "New Year's Day", title: "New Year's Day", type: 'Restricted', category: 'Restricted', day: 'Thursday', desc: 'First day of the Gregorian calendar year.' },
  { id: 38, date: '2026-01-05', name: 'Rongker Karkli', title: 'Rongker Karkli', type: 'Restricted', category: 'Restricted', day: 'Monday', desc: 'Traditional Karbi cultural and religious festival.' },
  { id: 39, date: '2026-01-13', name: 'Uruka of Magh Bihu', title: 'Uruka of Magh Bihu', type: 'Restricted', category: 'Restricted', day: 'Tuesday', desc: 'Traditional eve of Magh Bihu marked by community feasts and celebrations.' },
  { id: 40, date: '2026-01-17', name: 'Silpi Divas', title: 'Silpi Divas', type: 'Restricted', category: 'Restricted', day: 'Saturday', desc: 'Day commemorating artists and cultural practitioners of Assam.' },
  { id: 41, date: '2026-01-27', name: 'Busu Dima Festival', title: 'Busu Dima Festival', type: 'Restricted', category: 'Restricted', day: 'Tuesday', desc: 'Traditional festival of the Dimasa community.' },
  { id: 42, date: '2026-02-04', name: 'Shab-E-Barat', title: 'Shab-E-Barat', type: 'Restricted', category: 'Restricted', day: 'Wednesday', desc: 'Islamic night of prayer and remembrance.' },
  { id: 43, date: '2026-02-15', name: 'Sivaratri', title: 'Sivaratri', type: 'Restricted', category: 'Restricted', day: 'Sunday', desc: 'Hindu festival dedicated to Lord Shiva.' },
  { id: 44, date: '2026-02-17', name: 'Karbi-Dehal-Kachir Dom', title: 'Karbi-Dehal-Kachir Dom', type: 'Restricted', category: 'Restricted', day: 'Tuesday', desc: 'Traditional Karbi cultural observance.' },
  { id: 45, date: '2026-02-18', name: 'Ali Aye Ligang', title: 'Ali Aye Ligang', type: 'Restricted', category: 'Restricted', day: 'Wednesday', desc: 'Traditional Mising agricultural festival marking the beginning of sowing season.' },
  { id: 46, date: '2026-03-02', name: 'Khring Khring Baithow Puja', title: 'Khring Khring Baithow Puja', type: 'Restricted', category: 'Restricted', day: 'Monday', desc: 'Traditional Baithow Puja observance.' },
  { id: 47, date: '2026-03-17', name: 'Lailatur Qadar', title: 'Lailatur Qadar', type: 'Restricted', category: 'Restricted', day: 'Tuesday', desc: 'Islamic night of special prayer and spiritual observance.' },
  { id: 48, date: '2026-03-25', name: 'Tora Chira Bihu', title: 'Tora Chira Bihu', type: 'Restricted', category: 'Restricted', day: 'Wednesday', desc: 'Traditional Bihu observance in Assam.' },
  { id: 49, date: '2026-03-31', name: 'Mahabir Jayanti', title: 'Mahabir Jayanti', type: 'Restricted', category: 'Restricted', day: 'Tuesday', desc: 'Birth anniversary of Lord Mahavira.' },
  { id: 50, date: '2026-04-04', name: 'Easter Saturday', title: 'Easter Saturday', type: 'Restricted', category: 'Restricted', day: 'Saturday', desc: 'Christian observance preceding Easter Sunday.' },
  { id: 51, date: '2026-04-15', name: 'Deuri Bihu', title: 'Deuri Bihu', type: 'Restricted', category: 'Restricted', day: 'Wednesday', desc: 'Traditional Bihu festival observed by the Deori community.' },
  { id: 52, date: '2026-04-18', name: 'Birthday of Gurudev Kalicharan Brahma', title: 'Birthday of Gurudev Kalicharan Brahma', type: 'Restricted', category: 'Restricted', day: 'Saturday', desc: 'Birth anniversary of social and religious reformer Gurudev Kalicharan Brahma.' },
  { id: 53, date: '2026-04-22', name: 'Tithi of Gopal Dev', title: 'Tithi of Gopal Dev', type: 'Restricted', category: 'Restricted', day: 'Wednesday', desc: 'Commemoration of the Tithi of saint Gopal Dev.' },
  { id: 54, date: '2026-05-01', name: 'Sati Radhika Utsav', title: 'Sati Radhika Utsav', type: 'Restricted', category: 'Restricted', day: 'Friday', desc: 'Traditional religious and cultural observance commemorating Sati Radhika.' },
  { id: 55, date: '2026-05-16', name: 'Tithi of Hari Dev', title: 'Tithi of Hari Dev', type: 'Restricted', category: 'Restricted', day: 'Saturday', desc: 'Commemoration of the Tithi of Hari Dev.' },
  { id: 56, date: '2026-05-23', name: 'Birthday of Sri Sri Krishnaguru', title: 'Birthday of Sri Sri Krishnaguru', type: 'Restricted', category: 'Restricted', day: 'Saturday', desc: 'Birth anniversary celebration of Sri Sri Krishnaguru.' },
  { id: 57, date: '2026-05-24', name: 'Motak Roja Swargadeo Sarbananda Singha Divas', title: 'Motak Roja Swargadeo Sarbananda Singha Divas', type: 'Restricted', category: 'Restricted', day: 'Sunday', desc: 'Day commemorating Swargadeo Sarbananda Singha.' },
  { id: 58, date: '2026-05-31', name: 'Baikhowa Festival', title: 'Baikhowa Festival', type: 'Restricted', category: 'Restricted', day: 'Sunday', desc: 'Traditional Baikhowa festival celebrated by the Rabha community.' },
  { id: 59, date: '2026-06-20', name: 'Death Anniversary of Bishnu Prasad Rabha', title: 'Death Anniversary of Bishnu Prasad Rabha', type: 'Restricted', category: 'Restricted', day: 'Saturday', desc: 'Death anniversary of noted Assamese cultural icon Bishnu Prasad Rabha.' },
  { id: 60, date: '2026-06-30', name: 'Hul Divas', title: 'Hul Divas', type: 'Restricted', category: 'Restricted', day: 'Tuesday', desc: 'Day commemorating the Santhal Hul uprising.' },
  { id: 61, date: '2026-07-13', name: 'Birthday of Nepali Poet Bhanu Bhakta Acharya', title: 'Birthday of Nepali Poet Bhanu Bhakta Acharya', type: 'Restricted', category: 'Restricted', day: 'Monday', desc: 'Birth anniversary of Nepali poet Bhanu Bhakta Acharya.' },
  { id: 62, date: '2026-08-13', name: 'Death Anniversary of Bir Tikendrajit', title: 'Death Anniversary of Bir Tikendrajit', type: 'Restricted', category: 'Restricted', day: 'Thursday', desc: 'Death anniversary of Manipuri freedom fighter Bir Tikendrajit.' },
  { id: 63, date: '2026-08-26', name: 'Fateha-e-Dwaz-Daham', title: 'Fateha-e-Dwaz-Daham', type: 'Restricted', category: 'Restricted', day: 'Wednesday', desc: 'Islamic religious observance.' },
  { id: 64, date: '2026-09-15', name: 'Nau khai Festival', title: 'Nau khai Festival', type: 'Restricted', category: 'Restricted', day: 'Tuesday', desc: 'Traditional harvest festival celebrating the first consumption of newly harvested grain.' },
  { id: 65, date: '2026-09-16', name: 'Birthday of Sri Sri Thakur Anukul Chandra', title: 'Birthday of Sri Sri Thakur Anukul Chandra', type: 'Restricted', category: 'Restricted', day: 'Wednesday', desc: 'Birth anniversary of spiritual teacher Sri Sri Thakur Anukul Chandra.' },
  { id: 66, date: '2026-11-01', name: 'Kuki Chavang Kut', title: 'Kuki Chavang Kut', type: 'Restricted', category: 'Restricted', day: 'Sunday', desc: 'Traditional harvest festival of the Kuki community.' },
  { id: 67, date: '2026-11-07', name: 'Wangala Festival', title: 'Wangala Festival', type: 'Restricted', category: 'Restricted', day: 'Saturday', desc: 'Traditional harvest festival of the Garo community.' },
  { id: 68, date: '2026-11-11', name: 'Abhibhav Tithi of Sri Sri Bhubaneswar Sadhu Thakur', title: 'Abhibhav Tithi of Sri Sri Bhubaneswar Sadhu Thakur', type: 'Restricted', category: 'Restricted', day: 'Wednesday', desc: 'Religious observance commemorating Sri Sri Bhubaneswar Sadhu Thakur.' },
  { id: 69, date: '2026-11-19', name: 'Bir Raghav Moran Divas', title: 'Bir Raghav Moran Divas', type: 'Restricted', category: 'Restricted', day: 'Thursday', desc: 'Day commemorating Bir Raghav Moran.' },
  { id: 70, date: '2026-11-24', name: 'Death Anniversary of Guru Teg Bahadur Ji', title: 'Death Anniversary of Guru Teg Bahadur Ji', type: 'Restricted', category: 'Restricted', day: 'Tuesday', desc: 'Death anniversary of Sikh Guru Teg Bahadur Ji.' },
  { id: 71, date: '2026-12-05', name: 'Sikpui Ruoi', title: 'Sikpui Ruoi (Harvest Festival of Hmar Community)', type: 'Restricted', category: 'Restricted', day: 'Saturday', desc: 'Harvest festival of the Hmar community.' },
  { id: 72, date: '2026-12-10', name: "Martyr's Day", title: "Martyr's Day", type: 'Restricted', category: 'Restricted', day: 'Thursday', desc: 'Day commemorating martyrs and their sacrifices.' },
  { id: 73, date: '2026-12-19', name: 'Death Anniversary of Shree Shree Aniruddhadev', title: 'Death Anniversary of Shree Shree Aniruddhadev', type: 'Restricted', category: 'Restricted', day: 'Saturday', desc: 'Death anniversary commemorating Shree Shree Aniruddhadev.' },
  { id: 74, date: '2026-12-22', name: 'Gaan Ngai', title: 'Gaan Ngai', type: 'Restricted', category: 'Restricted', day: 'Tuesday', desc: 'Traditional festival of the Zeliangrong community.' },
  { id: 75, date: '2026-12-24', name: 'Christmas Eve', title: 'Christmas Eve', type: 'Restricted', category: 'Restricted', day: 'Thursday', desc: 'Christian observance on the eve of Christmas.' },

  // SPECIAL CASUAL LEAVE (4 Items) - Section 10
  { id: 76, date: '2026-07-09', name: 'Matri Pitri Vandana (Phase 1)', title: 'Matri Pitri Vandana (Phase 1)', type: 'Special Casual Leave', category: 'Special Casual Leave', day: 'Thursday', desc: 'Special Casual Leave for State Govt employees (clubbed with 2nd Saturday & Sunday).' },
  { id: 77, date: '2026-07-10', name: 'Matri Pitri Vandana (Phase 1)', title: 'Matri Pitri Vandana (Phase 1)', type: 'Special Casual Leave', category: 'Special Casual Leave', day: 'Friday', desc: 'Special Casual Leave for State Govt employees (clubbed with 2nd Saturday & Sunday).' },
  { id: 78, date: '2026-07-23', name: 'Matri Pitri Vandana (Phase 2)', title: 'Matri Pitri Vandana (Phase 2)', type: 'Special Casual Leave', category: 'Special Casual Leave', day: 'Thursday', desc: 'Special Casual Leave for State Govt employees (clubbed with 4th Saturday & Sunday).' },
  { id: 79, date: '2026-07-24', name: 'Matri Pitri Vandana (Phase 2)', title: 'Matri Pitri Vandana (Phase 2)', type: 'Special Casual Leave', category: 'Special Casual Leave', day: 'Friday', desc: 'Special Casual Leave for State Govt employees (clubbed with 4th Saturday & Sunday).' }
];

export default function HolidayCalendarWidget() {
  const timeCtx = useServerTime() || {};
  const serverTime = timeCtx.serverTime;
  
  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date(serverTime || Date.now()));
  const [holidayFilter, setHolidayFilter] = useState('ALL');
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [copiedState, setCopiedState] = useState(false);

  // Combine 79 official GAD holidays with computed 2nd & 4th Saturday Weekend Off entries
  const [holidayData, setHolidayData] = useState(() => {
    return [...OFFICIAL_GAD_HOLIDAYS_2026, ...getWeekendOffSaturdays(2026)];
  });

  // Sync server date when provided
  useEffect(() => {
    if (serverTime) {
      const st = new Date(serverTime);
      setCurrentMonthDate(st);
    }
  }, [serverTime]);

  // Fetch API holidays on mount
  useEffect(() => {
    let isMounted = true;
    fetch('/api/holidays')
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.success && Array.isArray(data.holidays) && data.holidays.length > 0) {
          const normalized = data.holidays.map(h => ({
            id: h.id,
            date: h.date,
            name: h.name || h.title,
            title: h.title || h.name,
            type: h.type || h.category,
            category: h.category || h.type,
            day: h.day,
            desc: h.desc || h.description,
            description: h.description || h.desc
          }));
          setHolidayData(normalized);
        }
      })
      .catch(() => {
        // Fallback to offline GAD dataset + calculated 2nd & 4th Saturdays
      });
    return () => { isMounted = false; };
  }, []);

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  // Calendar Math
  const monthDays = useMemo(() => {
    const days = [];
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  }, [year, month]);

  const monthName = currentMonthDate.toLocaleString('default', { month: 'long' });

  const isToday = (dateObj) => {
    if (!dateObj) return false;
    const today = serverTime ? new Date(serverTime) : new Date();
    return (
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear()
    );
  };

  const getHolidaysForDate = (dateObj) => {
    if (!dateObj) return [];
    const yStr = dateObj.getFullYear();
    const mStr = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dStr = String(dateObj.getDate()).padStart(2, '0');
    const dateKey = `${yStr}-${mStr}-${dStr}`;

    return holidayData.filter(h => {
      const matchesFilter = holidayFilter === 'ALL' || h.type === holidayFilter;
      const matchesSearch = !searchQuery.trim() || 
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.desc && h.desc.toLowerCase().includes(searchQuery.toLowerCase()));
      return h.date === dateKey && matchesFilter && matchesSearch;
    });
  };

  // Compute Relative Day Text (e.g. "Today", "In 3 days", "In 2 weeks", "Passed")
  const getRelativeDateLabel = (dateStr) => {
    const today = serverTime ? new Date(serverTime) : new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { text: 'Today', color: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold' };
    if (diffDays === 1) return { text: 'Tomorrow', color: 'bg-indigo-100 text-indigo-800 border-indigo-300 font-extrabold' };
    if (diffDays > 1 && diffDays <= 7) return { text: `In ${diffDays} days`, color: 'bg-amber-100 text-amber-800 border-amber-300 font-bold' };
    if (diffDays > 7 && diffDays <= 30) return { text: `In ${Math.round(diffDays / 7)} wks`, color: 'bg-sky-100 text-sky-800 border-sky-300 font-medium' };
    if (diffDays > 30) return { text: `In ${Math.round(diffDays / 30)} mos`, color: 'bg-slate-100 text-slate-700 border-slate-300 font-medium' };
    return { text: 'Passed', color: 'bg-slate-100 text-slate-500 border-slate-200' };
  };

  const upcomingHolidays = useMemo(() => {
    const today = serverTime ? new Date(serverTime) : new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayKey = `${y}-${m}-${d}`;

    return holidayData
      .filter(h => h.date >= todayKey)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 6);
  }, [serverTime, holidayData]);

  // List View Holidays (Filtered for Current Month or Search)
  const listHolidays = useMemo(() => {
    const mStr = String(month + 1).padStart(2, '0');
    return holidayData
      .filter(h => {
        const matchesMonth = searchQuery.trim() ? true : h.date.startsWith(`${year}-${mStr}`);
        const matchesFilter = holidayFilter === 'ALL' || h.type === holidayFilter;
        const matchesSearch = !searchQuery.trim() || 
          h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          h.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (h.desc && h.desc.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesMonth && matchesFilter && matchesSearch;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [holidayData, year, month, holidayFilter, searchQuery]);

  const prevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const st = serverTime ? new Date(serverTime) : new Date();
    setCurrentMonthDate(new Date(st.getFullYear(), st.getMonth(), 1));
  };

  const gazettedCount = holidayData.filter(h => h.type === 'Gazetted').length;
  const halfHolidayCount = holidayData.filter(h => h.type === 'Half Holiday').length;
  const restrictedCount = holidayData.filter(h => h.type === 'Restricted').length;
  const specialCasualCount = holidayData.filter(h => h.type === 'Special Casual Leave').length;
  const weekendOffCount = holidayData.filter(h => h.type === 'Weekend Off').length;
  const totalCount = holidayData.length;

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'Gazetted':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold shadow-2xs';
      case 'Half Holiday':
        return 'bg-blue-100 text-blue-900 border-blue-300 font-extrabold shadow-2xs';
      case 'Special Casual Leave':
        return 'bg-purple-100 text-purple-900 border-purple-300 font-extrabold shadow-2xs';
      case 'Weekend Off':
        return 'bg-sky-100 text-sky-900 border-sky-300 font-extrabold shadow-2xs';
      default:
        return 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold shadow-2xs';
    }
  };

  const getDayCardStyle = (type) => {
    switch (type) {
      case 'Gazetted':
        return 'bg-emerald-50/90 border-emerald-300 hover:border-emerald-500 hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5';
      case 'Half Holiday':
        return 'bg-blue-50/90 border-blue-300 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5';
      case 'Special Casual Leave':
        return 'bg-purple-50/90 border-purple-300 hover:border-purple-500 hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5';
      case 'Weekend Off':
        return 'bg-sky-50/90 border-sky-300 hover:border-sky-500 hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5';
      default:
        return 'bg-amber-50/90 border-amber-300 hover:border-amber-500 hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5';
    }
  };

  const getPillTagStyle = (type) => {
    switch (type) {
      case 'Gazetted':
        return 'bg-emerald-600 text-white border-emerald-700 shadow-2xs';
      case 'Half Holiday':
        return 'bg-blue-600 text-white border-blue-700 shadow-2xs';
      case 'Special Casual Leave':
        return 'bg-purple-600 text-white border-purple-700 shadow-2xs';
      case 'Weekend Off':
        return 'bg-sky-600 text-white border-sky-700 shadow-2xs';
      default:
        return 'bg-amber-600 text-white border-amber-700 shadow-2xs';
    }
  };

  const getDotStyle = (type) => {
    switch (type) {
      case 'Gazetted':
        return 'bg-emerald-500 ring-2 ring-emerald-200';
      case 'Half Holiday':
        return 'bg-blue-500 ring-2 ring-blue-200';
      case 'Special Casual Leave':
        return 'bg-purple-500 ring-2 ring-purple-200';
      case 'Weekend Off':
        return 'bg-sky-500 ring-2 ring-sky-200';
      default:
        return 'bg-amber-500 ring-2 ring-amber-200';
    }
  };

  const filterOptions = [
    { label: `All (${totalCount})`, val: 'ALL', color: 'bg-slate-100 text-slate-800 border-slate-300' },
    { label: `Gazetted (${gazettedCount})`, val: 'Gazetted', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
    { label: `Weekend Off (${weekendOffCount})`, val: 'Weekend Off', color: 'bg-sky-50 text-sky-800 border-sky-300' },
    { label: `Restricted (${restrictedCount})`, val: 'Restricted', color: 'bg-amber-50 text-amber-800 border-amber-300' },
    { label: `Special Casual (${specialCasualCount})`, val: 'Special Casual Leave', color: 'bg-purple-50 text-purple-800 border-purple-300' },
    { label: `Half Holiday (${halfHolidayCount})`, val: 'Half Holiday', color: 'bg-blue-50 text-blue-800 border-blue-300' },
  ];

  const handleCopyInfo = (holiday) => {
    const textToCopy = `${holiday.name} (${holiday.type} Holiday)\nDate: ${holiday.date} (${holiday.day})\nDetails: ${holiday.desc}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4 transition-all">
      
      {/* Top Header & Action Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Official Assam GAD Holiday Calendar 2026
              </h2>
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                e-file No. 221561/440
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Govt of Assam General Administration Department Official Notification Roster
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid' 
                  ? 'bg-white text-slate-900 shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Month Grid View"
            >
              <Grid className="h-3.5 w-3.5" />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list' 
                  ? 'bg-white text-slate-900 shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Chronological List View"
            >
              <List className="h-3.5 w-3.5" />
              <span>List</span>
            </button>
          </div>

          {/* Today Button */}
          <button
            onClick={goToToday}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
            title="Jump to Current Month"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Today</span>
          </button>

          {/* Download Official PDF */}
          <a
            href="/api/holidays/pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-colors shadow-2xs cursor-pointer"
            title="Download Official Notification PDF"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Official PDF</span>
          </a>
        </div>
      </div>

      {/* Navigation, Search & Category Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200">
          
          {/* Month Navigator Header */}
          <div className="flex items-center justify-between md:justify-start gap-2">
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-all cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-extrabold text-slate-900 text-xs sm:text-sm px-3 min-w-32 text-center font-mono">
                {monthName} {year}
              </span>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-all cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search holidays (e.g., Bihu, Diwali)..."
              className="w-full pl-9 pr-8 py-1.5 rounded-xl text-xs font-medium bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 shadow-2xs transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Pills Filter Bar */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1 mr-1">
            <Filter className="h-3 w-3 text-slate-600" />
            Filter:
          </span>
          {filterOptions.map((opt) => {
            const isActive = holidayFilter === opt.val;
            return (
              <button
                key={opt.val}
                onClick={() => setHolidayFilter(opt.val)}
                className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs' 
                    : `${opt.color} hover:opacity-85`
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content: Grid View vs List View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* Left 2 Cols: Calendar Grid (Balanced & Legible) */}
          <div className="lg:col-span-2 space-y-2">
            
            {/* Day Headers (Sun-Sat) */}
            <div className="grid grid-cols-7 gap-1 text-center py-2 bg-slate-100 rounded-xl border border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
              <span className="text-rose-600">Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span className="text-sky-700">Sat</span>
            </div>

            {/* Days Grid - Balanced Cell Heights (min-h-[58px] sm:min-h-[64px]) */}
            <div className="grid grid-cols-7 gap-1.5">
              {monthDays.map((d, idx) => {
                if (!d) return (
                  <div 
                    key={`empty-${idx}`} 
                    className="min-h-[58px] sm:min-h-[64px] rounded-xl bg-slate-50/60 border border-slate-100" 
                  />
                );
                
                const rawHolidays = getHolidaysForDate(d);
                const hasHoliday = rawHolidays.length > 0;
                const today = isToday(d);
                const isSelected = selectedDate === d.toDateString();
                const isSun = d.getDay() === 0;
                const isSat = d.getDay() === 6;

                return (
                  <div
                    key={d.toString()}
                    onClick={() => {
                      setSelectedDate(d.toDateString());
                      if (hasHoliday) {
                        setSelectedHoliday(rawHolidays[0]);
                      }
                    }}
                    className={`min-h-[58px] sm:min-h-[64px] rounded-xl p-1.5 border flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-indigo-500 border-indigo-400 bg-indigo-50/70 shadow-xs'
                        : hasHoliday
                        ? getDayCardStyle(rawHolidays[0].type)
                        : today
                        ? 'bg-indigo-50/80 border-indigo-300 font-extrabold shadow-2xs'
                        : isSat
                        ? 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Top Row: Date Numeral & Category Indicator */}
                    <div className="flex items-center justify-between text-[11px] px-0.5">
                      <span className={`font-mono font-extrabold flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'text-white bg-indigo-600 h-5 w-5 rounded-full aspect-square text-[10px] ring-2 ring-indigo-400 shadow-2xs'
                          : today 
                          ? 'text-white bg-indigo-600 h-5 w-5 rounded-full aspect-square text-[10px] shadow-2xs' 
                          : isSun
                          ? 'text-rose-600'
                          : isSat
                          ? 'text-sky-700'
                          : 'text-slate-800'
                      }`}>
                        {d.getDate()}
                      </span>
                      {hasHoliday && (
                        <span className={`h-1.5 w-1.5 rounded-full ${getDotStyle(rawHolidays[0].type)}`} />
                      )}
                    </div>

                    {/* Holiday Title Label Badge */}
                    {hasHoliday ? (
                      <div className="space-y-0.5">
                        <span className={`text-[10px] font-extrabold truncate block px-1 py-0.5 rounded leading-tight text-slate-900 ${getPillTagStyle(rawHolidays[0].type)}`}>
                          {rawHolidays[0].name}
                        </span>
                        {rawHolidays.length > 1 && (
                          <span className="text-[9px] font-bold text-slate-600 bg-slate-200 px-1 rounded block w-fit">
                            +{rawHolidays.length - 1} more
                          </span>
                        )}
                      </div>
                    ) : (
                      (isSelected || today) && (
                        <span className="text-[9px] font-extrabold uppercase text-indigo-700 tracking-wider">
                          {isSelected && !today ? 'Selected' : 'Today'}
                        </span>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 1 Col: Upcoming Holidays Sidebar */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <PartyPopper className="h-4 w-4 text-amber-500" />
                Upcoming Holidays
              </h3>
              <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                GAD Roster
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {upcomingHolidays.map((h) => {
                const relLabel = getRelativeDateLabel(h.date);
                return (
                  <div
                    key={h.id}
                    onClick={() => setSelectedHoliday(h)}
                    className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs hover:border-amber-400 transition-all cursor-pointer space-y-1"
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <span className="font-extrabold text-slate-900 text-xs block truncate min-w-0">
                        {h.name}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] shrink-0 border ${relLabel.color}`}>
                        {relLabel.text}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span className="font-mono font-bold text-slate-600">{h.date} ({h.day})</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] border ${getBadgeStyle(h.type)}`}>
                        {h.type}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Stat Box */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 text-xs">
              <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1">
                <Bookmark className="h-3.5 w-3.5 text-indigo-600" />
                Roster Totals 2026
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px] font-medium text-slate-600">
                <div>• Gazetted: <strong>35</strong></div>
                <div>• Weekend Off: <strong>24</strong></div>
                <div>• Restricted: <strong>39</strong></div>
                <div>• Special Casual: <strong>4</strong></div>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* List View (Chronological View) */
        <div className="bg-slate-50/50 rounded-3xl border border-slate-200 p-4 sm:p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-indigo-600" />
              Chronological Holiday Listing ({listHolidays.length} Holidays)
            </h3>
            {searchQuery && (
              <span className="text-xs font-bold text-slate-500">
                Filtered by "{searchQuery}"
              </span>
            )}
          </div>

          {listHolidays.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-semibold text-sm">
              No holidays found matching your current filter and search query.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {listHolidays.map((h) => {
                const relLabel = getRelativeDateLabel(h.date);
                return (
                  <div
                    key={h.id}
                    onClick={() => setSelectedHoliday(h)}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">{h.name}</h4>
                        <p className="text-xs font-mono font-bold text-slate-500">{h.date} • {h.day}</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs shrink-0 border ${getBadgeStyle(h.type)}`}>
                        {h.type}
                      </span>
                    </div>
                    {h.desc && (
                      <p className="text-xs text-slate-600 font-medium leading-relaxed line-clamp-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        {h.desc}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Footer Official Notice */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 text-xs text-slate-600 flex items-center gap-3">
        <Info className="h-5 w-5 text-indigo-600 shrink-0" />
        <span className="leading-relaxed font-medium">
          Official Govt. of Assam General Administration Dept Notification e-file No. 221561/440. Includes Gazetted (35), Half Holiday (1), Restricted (39), Special Casual Leave (4), and 2nd &amp; 4th Saturday Weekend Offs (24).
        </span>
      </div>

      {/* Redesigned Details Modal */}
      {selectedHoliday && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white max-w-md w-full p-6 rounded-3xl border border-slate-200 space-y-4 shadow-2xl relative text-sm">
            <button 
              onClick={() => setSelectedHoliday(null)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-black border ${getBadgeStyle(selectedHoliday.type)}`}>
                  {selectedHoliday.type} Holiday
                </span>
                {(() => {
                  const relLabel = getRelativeDateLabel(selectedHoliday.date);
                  return (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs border ${relLabel.color}`}>
                      {relLabel.text}
                    </span>
                  );
                })()}
              </div>

              <h3 className="text-xl font-black text-slate-900 pt-1 leading-snug">
                {selectedHoliday.name}
              </h3>
              
              <div className="flex items-center gap-2 text-xs font-mono font-extrabold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200 w-fit">
                <CalendarIcon className="h-4 w-4 text-indigo-600" />
                <span>{selectedHoliday.date} ({selectedHoliday.day})</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Official Description</span>
              <p className="text-slate-700 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs sm:text-sm">
                {selectedHoliday.desc}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => handleCopyInfo(selectedHoliday)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-all"
              >
                {copiedState ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-600" />}
                <span>{copiedState ? 'Copied to Clipboard!' : 'Copy Holiday Info'}</span>
              </button>

              <button
                onClick={() => setSelectedHoliday(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-all shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
