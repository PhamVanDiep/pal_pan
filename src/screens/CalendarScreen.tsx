import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import {Lunar, Solar} from 'lunar-javascript';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, {
  TimestampTrigger,
  TriggerType,
  RepeatFrequency,
} from '@notifee/react-native';
import {useLoading} from '../context/LoadingContext';
import {useToast} from '../context/ToastContext';

interface NoteData {
  [dateKey: string]: {
    note: string;
    hasNotification: boolean;
  };
}

const CalendarScreen = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [notes, setNotes] = useState<NoteData>({});
  const [currentNote, setCurrentNote] = useState('');
  const [hasNotification, setHasNotification] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const {showLoading, hideLoading} = useLoading();
  const {showSuccess, showError, showInfo} = useToast();

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    const dateKey = getDateKey(selectedDate);
    const noteData = notes[dateKey];
    if (noteData) {
      setCurrentNote(noteData.note);
      setHasNotification(noteData.hasNotification);
    } else {
      setCurrentNote('');
      setHasNotification(false);
    }
  }, [selectedDate, notes]);

  const getDateKey = (date: Date) => {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  };

  const loadNotes = async () => {
    try {
      const savedNotes = await AsyncStorage.getItem('calendarNotes');
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const saveNote = async () => {
    const dateKey = getDateKey(selectedDate);

    if (!currentNote.trim()) {
      // Remove note if empty
      const newNotes = {...notes};
      delete newNotes[dateKey];

      // Cancel notification if exists
      if (notes[dateKey]?.hasNotification) {
        await cancelNotification(dateKey);
      }

      setNotes(newNotes);
      await AsyncStorage.setItem('calendarNotes', JSON.stringify(newNotes));
      setShowNoteModal(false);
      showInfo('Đã xóa ghi chú');
      return;
    }

    const newNotes = {
      ...notes,
      [dateKey]: {
        note: currentNote.trim(),
        hasNotification,
      },
    };

    setNotes(newNotes);
    await AsyncStorage.setItem('calendarNotes', JSON.stringify(newNotes));

    // Schedule or cancel notification
    if (hasNotification) {
      await scheduleNotification(dateKey, currentNote.trim());
    } else {
      await cancelNotification(dateKey);
    }

    setShowNoteModal(false);
    showSuccess('Đã lưu ghi chú');
  };

  const scheduleNotification = async (dateKey: string, note: string) => {
    try {
      const [year, month, day] = dateKey.split('-').map(Number);
      const notificationDate = new Date(year, month - 1, day, 7, 0, 0); // 7:00 AM

      if (notificationDate.getTime() <= Date.now()) {
        showError('Không thể đặt thông báo cho ngày trong quá khứ');
        setHasNotification(false);
        return;
      }

      // Create notification channel for Android
      await notifee.createChannel({
        id: 'calendar-reminders',
        name: 'Nhắc nhở lịch',
        importance: 4,
      });

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: notificationDate.getTime(),
      };

      await notifee.createTriggerNotification(
        {
          id: `calendar-${dateKey}`,
          title: '📅 Nhắc nhở từ lịch',
          body: note,
          android: {
            channelId: 'calendar-reminders',
            smallIcon: 'ic_launcher',
            pressAction: {
              id: 'default',
            },
          },
        },
        trigger,
      );

      showSuccess(`Đã đặt thông báo lúc 7:00 sáng ngày ${day}/${month}/${year}`);
    } catch (error) {
      console.error('Error scheduling notification:', error);
      showError('Không thể đặt thông báo');
      setHasNotification(false);
    }
  };

  const cancelNotification = async (dateKey: string) => {
    try {
      await notifee.cancelNotification(`calendar-${dateKey}`);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  };

  const openNoteModal = (date: Date) => {
    setSelectedDate(date);
    setShowNoteModal(true);
  };

  const closeNoteModal = () => {
    setShowNoteModal(false);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return {daysInMonth, startingDayOfWeek};
  };

  const getLunarDate = (date: Date) => {
    try {
      const solar = Solar.fromDate(date);
      const lunar = solar.getLunar();
      return {
        day: lunar.getDay(),
        month: lunar.getMonth(),
        year: lunar.getYear(),
        monthInChinese: lunar.getMonthInChinese(),
        dayInChinese: lunar.getDayInChinese(),
      };
    } catch (error) {
      return null;
    }
  };

  const renderCalendar = () => {
    const {daysInMonth, startingDayOfWeek} = getDaysInMonth(currentMonth);
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const days = [];
    const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    // Render week day headers
    const headers = weekDays.map((day, index) => (
      <View key={`header-${index}`} style={styles.dayHeader}>
        <Text style={styles.dayHeaderText}>{day}</Text>
      </View>
    ));

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = getDateKey(date);
      const hasNote = !!notes[dateKey];

      const isSelected =
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === month &&
        selectedDate.getFullYear() === year;
      const isToday =
        new Date().getDate() === day &&
        new Date().getMonth() === month &&
        new Date().getFullYear() === year;

      const lunarInfo = getLunarDate(date);

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            isSelected && styles.selectedDay,
            isToday && styles.todayBorder,
          ]}
          onPress={() => setSelectedDate(date)}>
          <View style={styles.dayContent}>
            <Text
              style={[
                styles.dayText,
                isSelected && styles.selectedDayText,
                isToday && styles.todayText,
              ]}>
              {day}
            </Text>
            {lunarInfo && (
              <Text
                style={[
                  styles.lunarText,
                  isSelected && styles.selectedLunarText,
                ]}>
                {lunarInfo.day}
              </Text>
            )}
            {hasNote && (
              <View
                style={[
                  styles.noteIndicator,
                  isSelected && styles.noteIndicatorSelected,
                ]}
              />
            )}
          </View>
        </TouchableOpacity>,
      );
    }

    return (
      <>
        <View style={styles.weekRow}>{headers}</View>
        <View style={styles.daysContainer}>{days}</View>
      </>
    );
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentMonth(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  const selectMonthYear = async (month: number, year: number) => {
    showLoading('Đang tải lịch...');
    setShowMonthYearPicker(false);

    // Simulate loading effect
    await new Promise(resolve => setTimeout(resolve, 300));

    const newDate = new Date(year, month, 1);
    setCurrentMonth(newDate);
    hideLoading();
  };

  const monthNames = [
    'Tháng 1',
    'Tháng 2',
    'Tháng 3',
    'Tháng 4',
    'Tháng 5',
    'Tháng 6',
    'Tháng 7',
    'Tháng 8',
    'Tháng 9',
    'Tháng 10',
    'Tháng 11',
    'Tháng 12',
  ];

  const selectedLunar = getLunarDate(selectedDate);

  // Generate year range from 1970 to current year
  const currentYear = new Date().getFullYear();
  const years = Array.from({length: currentYear - 1970 + 1}, (_, i) => 1970 + i).reverse();

  // Scroll to current year when modal opens
  useEffect(() => {
    if (showMonthYearPicker && scrollViewRef.current) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        const selectedYear = currentMonth.getFullYear();
        const yearIndex = years.indexOf(selectedYear);
        if (yearIndex >= 0) {
          // Each year section is approximately 180px tall (adjust if needed)
          const YEAR_SECTION_HEIGHT = 180;
          scrollViewRef.current?.scrollTo({
            y: yearIndex * YEAR_SECTION_HEIGHT,
            animated: false,
          });
        }
      }, 100);
    }
  }, [showMonthYearPicker]);

  const renderMonthYearPicker = () => {
    const selectedYear = currentMonth.getFullYear();
    const selectedMonth = currentMonth.getMonth();

    return (
      <Modal
        visible={showMonthYearPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMonthYearPicker(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMonthYearPicker(false)}>
          <TouchableOpacity
            activeOpacity={1}
            style={styles.pickerContainer}
            onPress={(e) => e.stopPropagation()}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Chọn Tháng và Năm</Text>
              <TouchableOpacity
                onPress={() => setShowMonthYearPicker(false)}
                style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={scrollViewRef}
              style={styles.pickerScrollView}
              showsVerticalScrollIndicator={true}>
              {years.map(year => (
                <View key={year} style={styles.yearSection}>
                  <Text style={styles.yearHeader}>{year}</Text>
                  <View style={styles.monthGrid}>
                    {monthNames.map((monthName, monthIndex) => {
                      const isSelected =
                        year === selectedYear && monthIndex === selectedMonth;
                      const isCurrent =
                        year === currentYear &&
                        monthIndex === new Date().getMonth();

                      return (
                        <TouchableOpacity
                          key={monthIndex}
                          style={[
                            styles.monthButton,
                            isSelected && styles.monthButtonSelected,
                            isCurrent && styles.monthButtonCurrent,
                          ]}
                          onPress={() => selectMonthYear(monthIndex, year)}>
                          <Text
                            style={[
                              styles.monthButtonText,
                              isSelected && styles.monthButtonTextSelected,
                              isCurrent && styles.monthButtonTextCurrent,
                            ]}>
                            {monthName.replace('Tháng ', 'T')}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lịch</Text>
      </View>

      <View style={styles.navigationBar}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => changeMonth(-1)}>
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.centerNav}>
          <TouchableOpacity onPress={() => setShowMonthYearPicker(true)}>
            <Text style={styles.monthYearText}>
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            <Text style={styles.tapToChangeText}>Nhấn để chọn</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
            <Text style={styles.todayButtonText}>Hôm nay</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => changeMonth(1)}>
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      {renderMonthYearPicker()}

      <ScrollView style={styles.scrollView}>
        <View style={styles.calendarContainer}>{renderCalendar()}</View>

        <View style={styles.selectedDateInfo}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Ngày Dương Lịch</Text>
            <Text style={styles.infoValue}>
              {selectedDate.getDate()}/{selectedDate.getMonth() + 1}/
              {selectedDate.getFullYear()}
            </Text>
          </View>

          {selectedLunar && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Ngày Âm Lịch</Text>
              <Text style={styles.infoValue}>
                {selectedLunar.day}/{selectedLunar.month}/{selectedLunar.year}
              </Text>
            </View>
          )}

          {/* Note Section */}
          <View style={styles.infoCard}>
            <View style={styles.noteHeader}>
              <Text style={styles.infoLabel}>Ghi Chú</Text>
              <TouchableOpacity
                style={styles.addNoteButton}
                onPress={() => openNoteModal(selectedDate)}>
                <Text style={styles.addNoteButtonText}>
                  {notes[getDateKey(selectedDate)] ? '✏️ Sửa' : '+ Thêm'}
                </Text>
              </TouchableOpacity>
            </View>
            {notes[getDateKey(selectedDate)] ? (
              <View style={styles.noteContent}>
                <Text style={styles.noteText}>
                  {notes[getDateKey(selectedDate)].note}
                </Text>
                {notes[getDateKey(selectedDate)].hasNotification && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      🔔 7:00 sáng
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.noNoteText}>Chưa có ghi chú</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Note Modal */}
      <Modal
        visible={showNoteModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeNoteModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.noteModal}>
            <View style={styles.noteModalHeader}>
              <Text style={styles.noteModalTitle}>
                Ghi chú - {selectedDate.getDate()}/{selectedDate.getMonth() + 1}/
                {selectedDate.getFullYear()}
              </Text>
              <TouchableOpacity onPress={closeNoteModal}>
                <Text style={styles.noteModalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.noteInput}
              placeholder="Nhập ghi chú của bạn..."
              placeholderTextColor="#999"
              value={currentNote}
              onChangeText={setCurrentNote}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <View style={styles.notificationToggle}>
              <View style={styles.notificationToggleLeft}>
                <Text style={styles.notificationToggleLabel}>
                  Nhắc nhở lúc 7:00 sáng
                </Text>
                <Text style={styles.notificationToggleDesc}>
                  Gửi thông báo vào ngày này
                </Text>
              </View>
              <Switch
                value={hasNotification}
                onValueChange={setHasNotification}
                trackColor={{false: '#DDD', true: '#8AB4F8'}}
                thumbColor={hasNotification ? '#3B5998' : '#F4F4F4'}
              />
            </View>

            <View style={styles.noteModalButtons}>
              <TouchableOpacity
                style={styles.noteModalButtonCancel}
                onPress={closeNoteModal}>
                <Text style={styles.noteModalButtonCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.noteModalButtonSave}
                onPress={saveNote}>
                <Text style={styles.noteModalButtonSaveText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#3B5998',
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  centerNav: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButton: {
    padding: 10,
    width: 40,
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 28,
    color: '#3B5998',
    fontWeight: 'bold',
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  tapToChangeText: {
    fontSize: 11,
    color: '#3B5998',
    marginTop: 2,
    textAlign: 'center',
  },
  todayButton: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#FF9500',
    borderRadius: 12,
  },
  todayButtonText: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  calendarContainer: {
    backgroundColor: '#FFF',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  dayContent: {
    alignItems: 'center',
    position: 'relative',
  },
  dayText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  lunarText: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  noteIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B5998',
    marginTop: 2,
  },
  noteIndicatorSelected: {
    backgroundColor: '#FFF',
  },
  selectedDay: {
    backgroundColor: '#3B5998',
    borderRadius: 8,
  },
  selectedDayText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  selectedLunarText: {
    color: '#E0E0E0',
  },
  todayBorder: {
    borderWidth: 2,
    borderColor: '#FF9500',
    borderRadius: 8,
  },
  todayText: {
    color: '#FF9500',
    fontWeight: 'bold',
  },
  selectedDateInfo: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  infoSubValue: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addNoteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#3B5998',
    borderRadius: 6,
  },
  addNoteButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  noteContent: {
    marginTop: 4,
  },
  noteText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  noNoteText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  notificationBadge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FFF4E6',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  notificationBadgeText: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noteModal: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  noteModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  noteModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  noteModalClose: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
    paddingLeft: 12,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#F9F9F9',
    minHeight: 120,
    maxHeight: 200,
    marginBottom: 16,
  },
  notificationToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 20,
  },
  notificationToggleLeft: {
    flex: 1,
  },
  notificationToggleLabel: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  notificationToggleDesc: {
    fontSize: 13,
    color: '#999',
  },
  noteModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  noteModalButtonCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  noteModalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  noteModalButtonSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3B5998',
  },
  noteModalButtonSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
  },
  pickerContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  pickerScrollView: {
    maxHeight: 500,
  },
  yearSection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  yearHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B5998',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  monthButton: {
    width: '25%',
    padding: 12,
    alignItems: 'center',
  },
  monthButtonSelected: {
    backgroundColor: '#3B5998',
    borderRadius: 8,
  },
  monthButtonCurrent: {
    backgroundColor: '#FFF4E6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  monthButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  monthButtonTextSelected: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  monthButtonTextCurrent: {
    color: '#FF9500',
    fontWeight: 'bold',
  },
});

export default CalendarScreen;
