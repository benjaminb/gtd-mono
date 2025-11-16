import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet from '@gorhom/bottom-sheet';
import { useTask } from '@gtd/core';
import { TaskCard } from '../components/TaskCard';
import { TaskBottomSheet } from '../components/TaskBottomSheet';

export const TaskListScreen: React.FC = () => {
  const {
    tasks,
    loading,
    error,
    getRootTasks,
    getChildren,
    updateTask,
    activeTimeTracking,
    toggleTimeTracking,
    filters,
    setFilters,
  } = useTask();

  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Toggle task expansion to show/hide subtasks
  const toggleExpand = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  // Flatten tasks to show in FlatList (including visible subtasks)
  const flattenTasks = () => {
    const flattened: Array<{ task: any; depth: number }> = [];

    const addTask = (task: any, depth: number = 0) => {
      flattened.push({ task, depth });

      // If expanded, add children
      if (expandedTasks.has(task.id)) {
        const children = getChildren(task.id);
        children.forEach(child => addTask(child, depth + 1));
      }
    };

    getRootTasks().forEach(task => addTask(task));
    return flattened;
  };

  const flattenedTasks = flattenTasks();

  const handleTaskLongPress = (task: any) => {
    setSelectedTask(task);
    bottomSheetRef.current?.snapToIndex(0);
  };

  const handleCloseBottomSheet = () => {
    bottomSheetRef.current?.close();
    setSelectedTask(null);
  };

  const handleDeleteTask = async () => {
    if (selectedTask) {
      Alert.alert(
        'Delete Task',
        `Are you sure you want to delete "${selectedTask.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await deleteTask(selectedTask.id);
              handleCloseBottomSheet();
            },
          },
        ]
      );
    }
  };

  // Calculate completion for selected task
  const selectedTaskChildren = selectedTask ? getChildren(selectedTask.id) : [];
  const selectedTaskCompletionPercent =
    selectedTaskChildren.length > 0
      ? Math.round((selectedTaskChildren.filter((c: any) => c.done).length / selectedTaskChildren.length) * 100)
      : 0;

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Search/Filter Bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks..."
          value={filters.name}
          onChangeText={(text) => setFilters({ ...filters, name: text })}
        />
      </View>

      {/* Task List */}
      <FlatList
        data={flattenedTasks}
        keyExtractor={(item) => item.task.id}
        renderItem={({ item }) => {
          const { task, depth } = item;
          const hasChildren = getChildren(task.id).length > 0;
          const isExpanded = expandedTasks.has(task.id);

          return (
            <View style={[styles.taskRow, { paddingLeft: 16 + depth * 20 }]}>
              {hasChildren && (
                <TouchableOpacity
                  style={styles.expandButton}
                  onPress={() => toggleExpand(task.id)}
                >
                  <Text style={styles.expandIcon}>
                    {isExpanded ? '▼' : '▶'}
                  </Text>
                </TouchableOpacity>
              )}
              <View style={styles.taskCardWrapper}>
                <TaskCard
                  task={task}
                  onPress={() => hasChildren && toggleExpand(task.id)}
                  onLongPress={() => handleTaskLongPress(task)}
                  onToggleDone={async () => {
                    await updateTask(task.id, { done: !task.done });
                  }}
                  onToggleTimeTracking={async () => {
                    await toggleTimeTracking(task.id);
                  }}
                  isTracking={activeTimeTracking === task.id}
                />
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tasks found</Text>
            <Text style={styles.emptySubtext}>
              {filters.name ? 'Try a different search' : 'Create your first task!'}
            </Text>
          </View>
        }
        contentContainerStyle={flattenedTasks.length === 0 ? styles.emptyList : undefined}
      />

      {/* Bottom Sheet for Task Details */}
      <TaskBottomSheet
        ref={bottomSheetRef}
        task={selectedTask}
        onEdit={() => {
          // TODO: Navigate to edit screen
          console.log('Edit task:', selectedTask?.name);
          handleCloseBottomSheet();
        }}
        onDelete={handleDeleteTask}
        onAddSubtask={() => {
          // TODO: Navigate to add subtask screen
          console.log('Add subtask to:', selectedTask?.name);
          handleCloseBottomSheet();
        }}
        onClose={handleCloseBottomSheet}
        isTracking={activeTimeTracking === selectedTask?.id}
        onToggleTracking={async () => {
          if (selectedTask) {
            await toggleTimeTracking(selectedTask.id);
          }
        }}
        childCount={selectedTaskChildren.length}
        completionPercent={selectedTaskCompletionPercent}
      />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    padding: 20,
  },
  searchBar: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandIcon: {
    fontSize: 12,
    color: '#666',
  },
  taskCardWrapper: {
    flex: 1,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
  },
});
