import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Task, formatDuration, calculateTotalSeconds } from '@gtd/core';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onLongPress?: () => void;
  onToggleDone: () => void;
  onToggleTimeTracking: () => void;
  isTracking: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onPress,
  onLongPress,
  onToggleDone,
  onToggleTimeTracking,
  isTracking,
}) => {
  const handleToggleDone = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleDone();
  };

  const handleToggleTracking = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggleTimeTracking();
  };

  const handleLongPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onLongPress?.();
  };

  const totalSeconds = calculateTotalSeconds(task.timeTracking);
  const timeDisplay = totalSeconds > 0 ? formatDuration(totalSeconds) : null;

  // Get emoji or first letter
  const displayChar = task.emoji || task.name.charAt(0).toUpperCase();

  return (
    <TouchableOpacity
      style={[styles.card, task.done && styles.cardDone]}
      onPress={onPress}
      onLongPress={handleLongPress}
      delayLongPress={500}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        {/* Checkbox */}
        <TouchableOpacity
          style={[styles.checkbox, task.done && styles.checkboxDone]}
          onPress={handleToggleDone}
        >
          {task.done && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>

        {/* Emoji/Icon */}
        <View style={[styles.icon, task.done && styles.iconDone]}>
          <Text style={styles.iconText}>{displayChar}</Text>
        </View>

        {/* Task Info */}
        <View style={styles.taskInfo}>
          <Text
            style={[styles.taskName, task.done && styles.taskNameDone]}
            numberOfLines={2}
          >
            {task.name}
          </Text>
          {timeDisplay && (
            <Text style={styles.timeText}>{timeDisplay}</Text>
          )}
          {task.source === 'ai-suggested' && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>AI</Text>
            </View>
          )}
        </View>
      </View>

      {/* Time Tracking Button */}
      <TouchableOpacity
        style={[styles.trackingButton, isTracking && styles.trackingButtonActive]}
        onPress={handleToggleTracking}
      >
        {isTracking ? (
          // Pause icon
          <View style={styles.pauseIcon}>
            <View style={styles.pauseBar} />
            <View style={styles.pauseBar} />
          </View>
        ) : (
          // Play icon
          <View style={styles.playIcon} />
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardDone: {
    opacity: 0.6,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxDone: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconDone: {
    backgroundColor: '#aaa',
  },
  iconText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  taskNameDone: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  timeText: {
    fontSize: 13,
    color: '#667eea',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#667eea',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  trackingButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  trackingButtonActive: {
    backgroundColor: '#ff9800',
  },
  playIcon: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: '#fff',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 3,
  },
  pauseIcon: {
    flexDirection: 'row',
    gap: 4,
  },
  pauseBar: {
    width: 4,
    height: 16,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
});
