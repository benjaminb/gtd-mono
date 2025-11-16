import React, { useMemo, forwardRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import type { Task } from '@gtd/core';
import { formatDuration, calculateTotalSeconds } from '@gtd/core';

interface TaskBottomSheetProps {
  task: Task | null;
  onEdit: () => void;
  onDelete: () => void;
  onAddSubtask: () => void;
  onClose: () => void;
  isTracking: boolean;
  onToggleTracking: () => void;
  childCount?: number;
  completionPercent?: number;
}

export const TaskBottomSheet = forwardRef<BottomSheet, TaskBottomSheetProps>(
  (
    {
      task,
      onEdit,
      onDelete,
      onAddSubtask,
      onClose,
      isTracking,
      onToggleTracking,
      childCount = 0,
      completionPercent = 0,
    },
    ref
  ) => {
    const snapPoints = useMemo(() => ['50%', '85%'], []);

    if (!task) return null;

    const totalSeconds = calculateTotalSeconds(task.timeTracking);
    const timeDisplay = formatDuration(totalSeconds);

    const customProps = task.customProperties || {};
    const propertyEntries = Object.entries(customProps);

    const handleAction = async (action: () => void) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      action();
      onClose();
    };

    const renderBackdrop = useMemo(
      () => (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      []
    );

    return (
      <BottomSheet
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={onClose}
        backdropComponent={renderBackdrop}
      >
        <ScrollView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              {task.emoji && <Text style={styles.emoji}>{task.emoji}</Text>}
              <Text style={styles.title}>{task.name}</Text>
            </View>
            <View style={[styles.statusBadge, task.done && styles.statusBadgeDone]}>
              <Text style={[styles.statusText, task.done && styles.statusTextDone]}>
                {task.done ? '✓ Complete' : '○ Active'}
              </Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            {childCount > 0 && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Progress</Text>
                <Text style={styles.statValue}>
                  {completionPercent}% ({childCount} subtasks)
                </Text>
              </View>
            )}
            {totalSeconds > 0 && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Time Spent</Text>
                <Text style={[styles.statValue, isTracking && styles.statValueTracking]}>
                  {isTracking && '⏱ '}{timeDisplay}
                </Text>
              </View>
            )}
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Created</Text>
              <Text style={styles.statValue}>
                {new Date(task.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Properties */}
          {propertyEntries.length > 0 && (
            <View style={styles.propertiesSection}>
              <Text style={styles.sectionTitle}>Properties</Text>
              {propertyEntries.map(([key, value]) => (
                <View key={key} style={styles.propertyItem}>
                  <Text style={styles.propertyKey}>{key}:</Text>
                  <Text style={styles.propertyValue}>
                    {Array.isArray(value) ? value.join(', ') : String(value)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={[styles.actionButton, isTracking && styles.actionButtonTracking]}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onToggleTracking();
              }}
            >
              <Text style={styles.actionButtonText}>
                {isTracking ? '⏸ Stop Tracking' : '▶ Start Tracking'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleAction(onEdit)}
            >
              <Text style={styles.actionButtonText}>✎ Edit Task</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleAction(onAddSubtask)}
            >
              <Text style={styles.actionButtonText}>+ Add Subtask</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonDanger]}
              onPress={async () => {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                // Note: Actual delete confirmation should be handled by parent
                onDelete();
                onClose();
              }}
            >
              <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>
                × Delete Task
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emoji: {
    fontSize: 28,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#e8eeff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusBadgeDone: {
    backgroundColor: '#e8f5e9',
  },
  statusText: {
    color: '#667eea',
    fontWeight: '600',
    fontSize: 13,
  },
  statusTextDone: {
    color: '#4CAF50',
  },
  statsContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  statValueTracking: {
    color: '#ff9800',
  },
  propertiesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  propertyItem: {
    flexDirection: 'row',
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  propertyKey: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    minWidth: 100,
  },
  propertyValue: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  actionsSection: {
    marginTop: 8,
    marginBottom: 40,
  },
  actionButton: {
    backgroundColor: '#667eea',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  actionButtonTracking: {
    backgroundColor: '#ff9800',
  },
  actionButtonDanger: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#f44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonTextDanger: {
    color: '#f44336',
  },
});
