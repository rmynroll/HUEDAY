import React, { useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface Point {
  x: number;
  y: number;
}

function pointsToPathD(points: Point[]): string {
  if (points.length === 0) return '';
  return points.reduce((d, p, i) => d + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`), '');
}

export default function DrawingTest() {
  const [paths, setPaths] = useState<Point[][]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const currentPathRef = useRef<Point[]>([]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentPathRef.current = [{ x: locationX, y: locationY }];
        setCurrentPath(currentPathRef.current);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        currentPathRef.current = [...currentPathRef.current, { x: locationX, y: locationY }];
        setCurrentPath(currentPathRef.current);
      },
      onPanResponderRelease: () => {
        if (currentPathRef.current.length > 0) {
          setPaths((prev) => [...prev, currentPathRef.current]);
        }
        currentPathRef.current = [];
        setCurrentPath([]);
      },
    })
  ).current;

  const handleClear = () => {
    setPaths([]);
    setCurrentPath([]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>El Yazısı Çizim Testi</Text>
        <Pressable onPress={handleClear} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Temizle</Text>
        </Pressable>
      </View>

      <View style={styles.canvas} {...panResponder.panHandlers}>
        <Svg style={StyleSheet.absoluteFill}>
          {paths.map((path, i) => (
            <Path
              key={i}
              d={pointsToPathD(path)}
              stroke="#1C1C1E"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
          {currentPath.length > 0 && (
            <Path
              d={pointsToPathD(currentPath)}
              stroke="#1C1C1E"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          )}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  clearButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  canvas: {
    height: 260,
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 14,
    overflow: 'hidden',
  },
});
