import React, { useMemo, useRef, useEffect } from 'react';
import { StyleSheet, View, FlatList, Dimensions } from 'react-native';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { useHuedayStore, todayKey } from '../../lib/storage';
import HandwritingJournal from '../../src/components/HandwritingJournal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 30 günlük bir tarih aralığı oluştur (Bugünden 15 gün önce ve 15 gün sonra)
const generateDatesRange = () => {
  const range = [];
  const today = parseISO(todayKey());
  for (let i = -15; i <= 15; i++) {
    const d = addDays(today, i);
    range.push(format(d, 'yyyy-MM-dd'));
  }
  return range;
};

export default function JournalTab() {
  const dates = useMemo(() => generateDatesRange(), []);
  const cards = useHuedayStore((s) => s.cards);
  
  const flatListRef = useRef<FlatList<string>>(null);

  // Sayfa yüklendiğinde otomatik olarak bugüne (index 15) odaklan
  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: 15, animated: false });
    }, 150);
  }, []);

  const renderItem = ({ item: date }: { item: string }) => {
    const card = cards[date];
    const palette = card?.palette || ['#E55B70', '#F7A8B8'];

    return (
      <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
        <HandwritingJournal date={date} palette={palette} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={dates}
        renderItem={renderItem}
        keyExtractor={(item) => item}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        // Optimize performance
        removeClippedSubviews={true}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F0',
  },
});
