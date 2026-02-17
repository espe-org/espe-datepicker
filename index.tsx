import ActionSheet from "espe-actionsheet";
import SegmentedControl from "espe-datepicker/SegmentedControl";
import moment from "moment";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  Appearance,
  Dimensions,
  Image,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DeviceInfo from "react-native-device-info";
import Modal from "react-native-modal";
import { Picker } from "react-native-wheel-pick";

type Mode = "date" | "time" | "datetime" | "workingdays" | "nodate";

type Action = {
  text: string;
  mode: Mode;
  onPress?: (a?: any, b?: any) => void;
};

interface IDatePickerProps {
  date?: Date;
  endDate?: Date;
  mode?: Mode;
  onConfirm: (date: Date, endDate?: Date) => void;
  onCancel?: () => void;
  children?: (showPicker: (e?: any) => void) => React.ReactElement;
  isVisible?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
  onDateChange?: (date: Date, endDate?: Date) => void;
  minuteInterval?: 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30;
  noInterval?: boolean;
  withEndDate?: boolean;
  useYearInput?: boolean;
  language?: "ru" | "en";
  isDarkMode?: boolean;
  mainColor?: string;
  actions?: Action[];
  selected?: number;
  workingDays?: number;
}

type IDatePickerModalProps = IDatePickerProps & {
  hidePicker: () => void;
};

const DatePickerModal: React.FunctionComponent<IDatePickerModalProps> = (
  props,
) => {
  const Locale = {
    weekDayNamesShort: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
    locale: {
      en: {
        Январь: "January",
        Февраль: "February",
        Март: "March",
        Апрель: "April",
        Май: "May",
        Июнь: "June",
        Июль: "July",
        Август: "August",
        Сентябрь: "September",
        Октябрь: "October",
        Ноябрь: "November",
        Декабрь: "December",
        Вс: "Sun",
        Пн: "Mon",
        Вт: "Tue",
        Ср: "Wed",
        Чт: "Thu",
        Пт: "Fri",
        Сб: "Sat",
        Время: "Time",
        "Выберите месяц": "Select Month",
        "Выберите год": "Select Year",
        Выбрать: "Select",
        начало: "beginning",
        окончание: "end",
        OK: "OK",
        Отмена: "Cancel",
        "рабочий день": "working day",
        "рабочих дня": "working days",
        "рабочих дней": "working days",
      },
      ru: {},
    } as Record<string, Record<string, string>>,
    getCurrentLocale() {
      return props.language || "en";
    },
    getItem(text: string, strict?: boolean): string {
      if (strict) {
        return this.locale[this.getCurrentLocale()][text];
      }
      return this.locale[this.getCurrentLocale()][text] || text;
    },
  };

  const AppConfig = {
    iOS: Platform.OS === "ios",
    android: Platform.OS === "android",
    // @ts-expect-error
    mac: Platform.isMacCatalyst,
    get isPad() {
      return this.windowWidth > 767 || this.mac;
    },
    hasNotch: DeviceInfo.hasNotch(),
    windowWidth: Dimensions.get("window").width,
    windowHeight: Dimensions.get("window").height,
    dark: props.isDarkMode ?? Appearance.getColorScheme() === "dark",
    date_limits: {
      min: new Date("1900"),
      max: new Date("2100"),
    },
    get mainColor() {
      return props.mainColor || (this.dark ? "#87DC84" : "#049A00");
    },
    get secondaryColor() {
      return this.dark ? "#888888" : "#777777";
    },
    get errorColor() {
      return this.dark ? "#E78080" : "#CC0000";
    },
    get plainColor() {
      return this.dark ? "white" : "black";
    },
    get grayColor() {
      return this.dark ? "#BABABA" : "#999999";
    },
    get borderColor() {
      return this.dark ? "#313131" : "#DDDDDD";
    },
    get mainBG() {
      return this.dark ? "black" : "white";
    },
  };

  const styles = StyleSheet.create({
    get container() {
      return {
        position: "absolute" as const,
        bottom: 0,
        overflow: "hidden" as const,
        justifyContent: "space-between" as const,
        alignSelf: "center" as const,
        borderRadius: 24,
        backgroundColor: AppConfig.dark ? "#242424" : AppConfig.mainBG,
        minHeight: 435,
        width: AppConfig.isPad
          ? 380
          : Math.min(AppConfig.windowWidth, AppConfig.windowHeight, 440) -
          (AppConfig.isPad ? 85 : 30),
        margin: 10,
        marginBottom:
          AppConfig.hasNotch || AppConfig.isPad || AppConfig.android ? 24 : 0,
      };
    },

    headerContainer: {
      flexDirection: "row",
      height: 55,
      width: "auto",
      paddingTop: 15,
      paddingBottom: 10,
      paddingHorizontal: 18,
      justifyContent: "space-between",
      alignItems: "center",
    },

    get textWrapper() {
      return {
        minHeight: 32,
        marginHorizontal: 4,
        paddingHorizontal: 12,
        backgroundColor: AppConfig.dark ? "#484848" : "#E8E8E8",
        borderRadius: 6,
        justifyContent: "center" as const,
        alignItems: "center" as const,
      };
    },

    get text() {
      return {
        color: AppConfig.plainColor,
        fontFamily: "TTNorms-Medium",
        fontSize: 16,
        textAlign: "center" as const,
      };
    },

    calendarContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 5,
      width: "auto",
      height: 264,
      paddingHorizontal: 10,
    },

    get dayText() {
      return {
        fontSize: 10,
        color: AppConfig.grayColor,
        fontFamily: "TTNorms-Regular",
        marginBottom: 4,
      };
    },

    dateBtn: {
      height: 36,
      width: "100%",
      margin: 2,
      padding: 4,
    },

    firstSelectedDate: {
      borderTopLeftRadius: 12,
      borderBottomLeftRadius: 12,
    },

    lastSelectedDate: {
      borderTopRightRadius: 12,
      borderBottomRightRadius: 12,
    },

    dateWrapper: {
      height: "100%",
      justifyContent: "center",
      borderRadius: 8,
    },

    dateText: {
      verticalAlign: "bottom",
      textAlign: "center",
      fontSize: 16,
      fontFamily: "TTNorms-Medium",
    },

    get timeContainer() {
      return {
        flexDirection: "row" as const,
        justifyContent: "space-around" as const,
        height: 48,
        borderTopWidth: 1,
        borderColor: AppConfig.borderColor,
        paddingHorizontal: 24,
      };
    },

    get timeText() {
      return {
        color: AppConfig.grayColor,
        fontFamily: "TTNorms-Medium",
        fontSize: 12,
      };
    },

    workingDaysWrapper: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      height: 48,
    },

    get actionsContainer() {
      return {
        paddingTop: 4,
        paddingBottom: 10,
        paddingHorizontal: 8,
        borderTopWidth: 1,
        borderColor: AppConfig.borderColor,
      };
    },

    actionWrapper: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 10,
    },

    get checkbox() {
      return {
        borderRadius: 8,
        backgroundColor: AppConfig.dark ? "#484848" : "#E8E8E8",
        marginRight: 10,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        height: 20,
        width: 20,
        // aspectRatio: 1,
      };
    },

    get actionText() {
      return {
        color: AppConfig.plainColor,
        fontFamily: "TTNorms-Medium",
        fontSize: 12,
      };
    },

    get buttonsContainer() {
      return {
        flexDirection: "row" as const,
        borderTopWidth: 1,
        borderColor: AppConfig.borderColor,
        width: "auto" as const,
      };
    },

    get buttonWrapper() {
      return {
        flex: 1,
        height: 45,
        justifyContent: "center" as const,
        alignItems: "center" as const,
        borderLeftWidth: 0.5,
        borderColor: AppConfig.borderColor,
      };
    },
  });

  const [selectedActionIndex, setSelectedActionIndex] = useState(
    props.selected ?? -1,
  );
  const [mode, setMode] = useState(
    props.actions?.[selectedActionIndex]?.mode || props.mode || "date",
  );
  const [workingDays, setWorkingDays] = useState(props.workingDays ?? 10);
  const minimumDate = props.minimumDate
    ? moment(props.minimumDate)
    : moment(AppConfig.date_limits.min);
  const maximumDate = props.maximumDate
    ? moment(props.maximumDate)
    : moment(AppConfig.date_limits.max);
  const minuteInterval = props.noInterval ? 1 : props.minuteInterval || 5;
  const [currentDate, setCurrentDate] = useState(() => {
    let date = props.date ? moment(props.date) : moment();

    if (date < minimumDate) {
      date = minimumDate.clone();
    } else if (date > maximumDate) {
      date = maximumDate.clone();
    }

    return date;
  });
  const [startDate, setStartDate] = useState(currentDate.clone());
  const [endDate, setEndDate] = useState(() => {
    let date =
      props.endDate && props.withEndDate ? moment(props.endDate) : null;

    if (date) {
      if (date < startDate) {
        date = startDate.clone();
      } else if (date > maximumDate) {
        date = maximumDate.clone();
      }
    }

    return date;
  });
  const [days, setDays] = useState([]);
  const [isMonthYearPicker, setIsMonthYearPicker] = useState(false);
  const [isStartTimePicker, setIsStartTimePicker] = useState(false);
  const [isEndTimePicker, setIsEndTimePicker] = useState(false);
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");
  const startDateTimeTextInputRef = useRef<TextInput>(null);
  const endDateTimeTextInputRef = useRef<TextInput>(null);
  const startHourTimeTextInputRef = useRef<TextInput>(null);
  const startMinuteTimeTextInputRef = useRef<TextInput>(null);
  const endHourTimeTextInputRef = useRef<TextInput>(null);
  const endMinuteTimeTextInputRef = useRef<TextInput>(null);
  const [firstСlickFirstDate, setFirstСlickFirstDate] = useState(
    !!props.withEndDate,
  );
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    if (minuteInterval !== 1) {
      startDate.minutes(
        round(
          startDate.minutes(),
          minuteInterval,
          startDate.format("DD.MM.YYYY") === minimumDate?.format("DD.MM.YYYY"),
        ),
      );
      setStartDate(startDate);

      if (endDate && props.withEndDate) {
        endDate.minutes(
          round(
            endDate.minutes(),
            minuteInterval,
            endDate.format("DD.MM.YYYY") === minimumDate?.format("DD.MM.YYYY"),
          ),
        );
        setEndDate(endDate);
      }
    }

    if (["date", "datetime", "workingdays", "nodate"].includes(mode)) {
      onChangeCalendar();
    } else if (mode === "time" && props.withEndDate) {
      setEndDate(startDate.clone());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setStartDateInput(startDate.format("DD.MM.YYYY"));
  }, [startDate]);

  useEffect(() => {
    if (endDate) {
      setEndDateInput(endDate?.format("DD.MM.YYYY"));
    }
  }, [endDate]);

  useEffect(() => {
    if (startDate < minimumDate) {
      setStartDate(minimumDate.clone());
    } else if (startDate > maximumDate) {
      setStartDate(maximumDate.clone());
    }

    if (endDate) {
      if (endDate < startDate) {
        setEndDate(startDate.clone());
      } else if (endDate > maximumDate) {
        setEndDate(maximumDate.clone());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.minimumDate, props.maximumDate]);

  useEffect(() => {
    if (props.onDateChange) {
      if (props.withEndDate && endDate) {
        props.onDateChange(startDate.toDate(), endDate.toDate());
      } else {
        props.onDateChange(startDate.toDate());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => setIsKeyboardOpen(true),
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setIsKeyboardOpen(false),
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const round = (number: number, interval: number, isCeil: boolean) => {
    const remainder = number % interval;
    number -= remainder;

    if (remainder !== 0 && isCeil) {
      number += interval;
    }

    return number;
  };

  const onConfirm = (date: Date, endDate?: Date) => {
    props.hidePicker();

    let onClick = props.onConfirm;
    if (props.actions?.[selectedActionIndex]) {
      onClick = props.actions[selectedActionIndex].onPress;

      if (mode === "workingdays") {
        // @ts-expect-error
        onClick(workingDays);
        return;
      }
    }

    if (props.withEndDate && endDate) {
      onClick(date, endDate);
    } else {
      onClick(date);
    }
  };

  const onChangeCalendar = () => {
    if (minimumDate > currentDate) {
      currentDate.set({
        date: minimumDate.date(),
        month: minimumDate.month(),
        year: minimumDate.year(),
      });
    }

    if (maximumDate < currentDate) {
      currentDate.set({
        date: maximumDate.date(),
        month: maximumDate.month(),
        year: maximumDate.year(),
      });
    }

    const days = Locale.weekDayNamesShort.map((name) => ({ name, dates: [] }));
    const firstDate = currentDate.clone().startOf("month");
    const lastDate = currentDate.clone().endOf("month");

    do {
      days[firstDate.day()].dates.push(firstDate.clone());
      firstDate.add(1, "day");
    } while (firstDate <= lastDate);

    // Воскресенье переносится в конец недели
    days.push(days[0]);
    days.shift();

    for (let i = 0; i < days.length - 1 && days[i].dates[0].date() !== 1; i++) {
      days[i].dates.unshift(null);
    }

    setDays(days);
    setCurrentDate(currentDate);
  };

  const onBlur = () => {
    if (startDate < minimumDate) {
      startDate.set({
        hours: minimumDate.hours(),
        minutes: round(minimumDate.minutes(), minuteInterval, true),
        date: minimumDate.date(),
        month: minimumDate.month(),
        year: minimumDate.year(),
      });
    } else if (startDate > maximumDate) {
      startDate.set({
        hours: maximumDate.hours(),
        minutes: round(maximumDate.minutes(), minuteInterval, false),
        date: maximumDate.date(),
        month: maximumDate.month(),
        year: maximumDate.year(),
      });
    } else {
      startDate.set({
        minutes: round(startDate.minutes(), minuteInterval, true),
      });
    }

    setStartDate(startDate.clone());
    setTimeout(() => {
      if (
        !startHourTimeTextInputRef?.current?.isFocused() &&
        !startMinuteTimeTextInputRef?.current?.isFocused()
      ) {
        setIsStartTimePicker(false);
      }
    }, 100);

    if (props.withEndDate && endDate) {
      if (endDate < startDate) {
        setEndDate(startDate.clone());
      } else if (endDate > maximumDate) {
        setEndDate(
          maximumDate
            .clone()
            .minutes(round(maximumDate.minutes(), minuteInterval, false)),
        );
      } else {
        setEndDate(
          endDate
            .clone()
            .minutes(round(endDate.minutes(), minuteInterval, false)),
        );
      }

      setTimeout(() => {
        if (
          !endHourTimeTextInputRef?.current?.isFocused() &&
          !endMinuteTimeTextInputRef?.current?.isFocused()
        ) {
          setIsEndTimePicker(false);
        }
      }, 100);
    }
  };

  const forceBlur = () => {
    if (startDateTimeTextInputRef?.current)
      startDateTimeTextInputRef.current.blur();
    if (endDateTimeTextInputRef?.current)
      endDateTimeTextInputRef.current.blur();
    if (startHourTimeTextInputRef?.current)
      startHourTimeTextInputRef.current.blur();
    if (startMinuteTimeTextInputRef?.current)
      startMinuteTimeTextInputRef.current.blur();
    if (endHourTimeTextInputRef?.current)
      endHourTimeTextInputRef.current.blur();
    if (endMinuteTimeTextInputRef?.current)
      endMinuteTimeTextInputRef.current.blur();
  };

  const capitalize = (string: string) =>
    string[0].toUpperCase() + string.substring(1);

  const getDateBGColor = (date) => {
    if (!date) {
      return undefined;
    } else if (
      endDate &&
      date.clone().endOf("day") >= startDate &&
      date.clone().startOf("day") <= endDate
    ) {
      return AppConfig.mainColor + "44";
    }

    return undefined;
  };

  const getDateTextColor = (date, index) => {
    if (
      !date ||
      [startDate.format("DD.MM.YYYY"), endDate?.format("DD.MM.YYYY")].includes(
        date.format("DD.MM.YYYY"),
      )
    ) {
      return "white";
    } else if (date.format("DD.MM.YYYY") === moment().format("DD.MM.YYYY")) {
      return AppConfig.mainColor;
    } else if ([5, 6].includes(index)) {
      return AppConfig.errorColor + "AA";
    } else if (
      date.clone().endOf("day") < minimumDate ||
      date.clone().startOf("day") > maximumDate
    ) {
      return "gray";
    }

    return AppConfig.plainColor;
  };

  const getDateBorderColor = (date, index) => {
    if (
      !date ||
      [startDate.format("DD.MM.YYYY"), endDate?.format("DD.MM.YYYY")].includes(
        date.format("DD.MM.YYYY"),
      )
    ) {
      return AppConfig.mainColor;
    } else if (date.format("DD.MM.YYYY") === moment().format("DD.MM.YYYY")) {
      return AppConfig.mainColor;
    } else if ([5, 6].includes(index)) {
      return AppConfig.errorColor + "AA";
    } else if (
      date.clone().endOf("day") < minimumDate ||
      date.clone().startOf("day") > maximumDate
    ) {
      return "gray";
    }

    return AppConfig.plainColor;
  };

  const getMonths = () => {
    return [
      "Январь",
      "Февраль",
      "Март",
      "Апрель",
      "Май",
      "Июнь",
      "Июль",
      "Август",
      "Сентябрь",
      "Октябрь",
      "Ноябрь",
      "Декабрь",
    ].reduce((arr, value, index) => {
      if (
        !(
          (currentDate.year() === minimumDate?.year() &&
            index < minimumDate.month()) ||
          (currentDate.year() === maximumDate?.year() &&
            index > maximumDate.month())
        )
      ) {
        arr.push({ value: index, label: Locale.getItem(value) });
      }
      return arr;
    }, []);
  };

  const getYears = () => {
    const years = [];
    let minYear = minimumDate.year();
    let maxYear = maximumDate.year();

    if (AppConfig.mac) {
      minYear = 1900; // currentDate.year() - 5;
      maxYear = 2100; // currentDate.year() + 5;
    }

    if (minYear < minimumDate?.year()) {
      minYear = minimumDate.year();
    }

    if (maxYear > maximumDate?.year()) {
      maxYear = maximumDate.year();
    }

    for (let year = minYear; year <= maxYear; year++) {
      years.push({ value: year, label: year.toString() });
    }

    return years;
  };

  const renderHeader = () => {
    const years = getYears();

    return (
      <View style={styles.headerContainer}>
        <View style={{ flex: 1 }}>
          {AppConfig.mac ||
            (!isMonthYearPicker &&
              !isStartTimePicker &&
              !isEndTimePicker &&
              currentDate.format("MM.YYYY") !==
              minimumDate?.format("MM.YYYY")) ? (
            <TouchableOpacity
              onPress={() => {
                forceBlur();
                currentDate.subtract(1, "month");
                onChangeCalendar();
                if (!props.withEndDate) {
                  startDate.set({
                    month: currentDate.month(),
                    year: currentDate.year(),
                  });
                }
                onBlur();
              }}
            >
              <Image
                source={require("./chevron-left.png")}
                style={{
                  width: 24,
                  height: 24,
                  tintColor: AppConfig.mainColor,
                }}
              />
            </TouchableOpacity>
          ) : null}
        </View>

        {AppConfig.mac ? (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={[
                styles.textWrapper,
                { flexDirection: "row", minWidth: 120, paddingRight: 6 },
              ]}
            >
              <ActionSheet
                forced
                actions={getMonths().map((month) => ({
                  text: month.label,
                  onPress: () => {
                    forceBlur();
                    currentDate.month(month.value);
                    onChangeCalendar();
                    if (!props.withEndDate) {
                      startDate.set({
                        month: currentDate.month(),
                        year: currentDate.year(),
                      });
                    }
                    onBlur();
                  },
                }))}
                message={Locale.getItem("Выберите месяц")}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
                forceModal
                classicMode
                isDarkMode={AppConfig.dark}
                mainColor={AppConfig.mainColor}
              >
                <Text
                  style={[styles.text, isMonthYearPicker && { fontSize: 19 }]}
                >
                  {capitalize(
                    currentDate
                      .locale(Locale.getCurrentLocale())
                      .format("MMMM "),
                  )}
                </Text>
                <Image
                  source={require("./chevron-down.png")}
                  style={{
                    width: 18,
                    height: 18,
                    tintColor: AppConfig.grayColor,
                  }}
                />
              </ActionSheet>
            </View>

            <View
              style={[
                styles.textWrapper,
                { flexDirection: "row", minWidth: 80 },
                !props.useYearInput && { paddingRight: 6 },
              ]}
            >
              {props.useYearInput ? (
                <TextInput
                  keyboardType="numeric"
                  value={currentDate.year().toString()}
                  selectTextOnFocus
                  onChangeText={(value) => {
                    if (+value >= 0 && value.length <= 4) {
                      currentDate.year(+value);
                      setCurrentDate(currentDate.clone());
                    }
                  }}
                  onBlur={() => {
                    onChangeCalendar();
                    if (!props.withEndDate) {
                      startDate.set({
                        month: currentDate.month(),
                        year: currentDate.year(),
                      });
                    }
                    onBlur();
                  }}
                  style={[styles.text, isMonthYearPicker && { fontSize: 19 }]}
                />
              ) : (
                <ActionSheet
                  forced
                  actions={years.map((year) => ({
                    text: year.label,
                    onPress: () => {
                      forceBlur();
                      currentDate.year(year.value);
                      if (!props.withEndDate) {
                        startDate.set({
                          month: currentDate.month(),
                          year: currentDate.year(),
                        });
                      }
                      onChangeCalendar();
                    },
                  }))}
                  message={Locale.getItem("Выберите год")}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                  forceModal
                  classicMode
                  scrollToIndex={years.findIndex(
                    ({ value }) => value === new Date().getFullYear(),
                  )}
                  isDarkMode={AppConfig.dark}
                  mainColor={AppConfig.mainColor}
                >
                  <Text
                    style={[styles.text, isMonthYearPicker && { fontSize: 19 }]}
                  >
                    {currentDate.year()}
                  </Text>
                  <Image
                    source={require("./chevron-down.png")}
                    style={{
                      width: 18,
                      height: 18,
                      tintColor: AppConfig.grayColor,
                    }}
                  />
                </ActionSheet>
              )}
            </View>
          </View>
        ) : !isMonthYearPicker ? (
          <TouchableOpacity
            style={[
              styles.textWrapper,
              {
                width: 160,
                justifyContent: "space-between",
                flexDirection: "row",
                paddingRight: 6,
              },
            ]}
            onPress={() => {
              forceBlur();
              setIsMonthYearPicker(!isMonthYearPicker);
              setIsStartTimePicker(false);
              setIsEndTimePicker(false);
            }}
          >
            <Text style={[styles.text, isMonthYearPicker && { fontSize: 19 }]}>
              {capitalize(
                currentDate
                  .locale(Locale.getCurrentLocale())
                  .format("MMMM YYYY"),
              )}
            </Text>
            <Image
              source={require("./chevron-down.png")}
              style={{ width: 18, height: 18, tintColor: AppConfig.grayColor }}
            />
          </TouchableOpacity>
        ) : null}

        <View style={{ flex: 1, alignItems: "flex-end" }}>
          {AppConfig.mac ||
            (!isMonthYearPicker &&
              !isStartTimePicker &&
              !isEndTimePicker &&
              currentDate.format("MM.YYYY") !==
              maximumDate?.format("MM.YYYY")) ? (
            <TouchableOpacity
              onPress={() => {
                forceBlur();
                currentDate.add(1, "month");
                onChangeCalendar();
                if (!props.withEndDate) {
                  startDate.set({
                    month: currentDate.month(),
                    year: currentDate.year(),
                  });
                }
                onBlur();
              }}
            >
              <Image
                source={require("./chevron-right.png")}
                style={{
                  width: 24,
                  height: 24,
                  tintColor: AppConfig.mainColor,
                }}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  const renderCalendar = () => (
    <View style={styles.calendarContainer}>
      {days.map(({ name, dates }, dayIndex) => (
        <View key={name} style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.dayText}>
            {Locale.getItem(name).toUpperCase()}
          </Text>

          {dates.map((date, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dateBtn,
                startDate.format("DD.MM.YYYY") === date?.format("DD.MM.YYYY") &&
                styles.firstSelectedDate,
                endDate?.format("DD.MM.YYYY") === date?.format("DD.MM.YYYY") &&
                styles.lastSelectedDate,
                { backgroundColor: getDateBGColor(date) },
              ]}
              disabled={
                !date ||
                date.clone().endOf("day") < minimumDate ||
                date.clone().startOf("day") > maximumDate
              }
              onPress={() => {
                const buf = date.clone().endOf("day").startOf("minute");
                buf.set({
                  hours: startDate.hours(),
                  minutes: startDate.minutes(),
                });

                if (buf < minimumDate) {
                  buf.set({
                    hours: minimumDate.hours(),
                    minutes: round(minimumDate.minutes(), minuteInterval, true),
                  });
                } else if (buf > maximumDate) {
                  buf.set({
                    hours: maximumDate.hours(),
                    minutes: round(
                      maximumDate.minutes(),
                      minuteInterval,
                      false,
                    ),
                  });
                }

                if (
                  props.withEndDate &&
                  !endDate &&
                  buf >= startDate &&
                  !firstСlickFirstDate
                ) {
                  setEndDate(buf);
                } else {
                  setStartDate(buf);
                  setEndDate(null);
                  setFirstСlickFirstDate(false);
                }
              }}
            >
              <View
                style={[
                  styles.dateWrapper,
                  {
                    backgroundColor:
                      date &&
                        [
                          startDate.format("DD.MM.YYYY"),
                          endDate?.format("DD.MM.YYYY"),
                        ].includes(date.format("DD.MM.YYYY"))
                        ? AppConfig.mainColor
                        : null,
                    borderWidth:
                      !!date &&
                        ([
                          startDate.format("DD.MM.YYYY"),
                          endDate?.format("DD.MM.YYYY"),
                        ].includes(date.format("DD.MM.YYYY")) ||
                          date.format("DD.MM.YYYY") ===
                          moment().format("DD.MM.YYYY"))
                        ? 2
                        : 0,
                    borderColor: getDateBorderColor(date, dayIndex),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dateText,
                    { color: getDateTextColor(date, dayIndex) },
                  ]}
                >
                  {date ? date.date() : null}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );

  const renderMonthYearPicker = () => {
    const setDate = isEndTimePicker ? setEndDate : setStartDate;
    const months = getMonths();
    const years = getYears();

    return (
      <View style={{ flexDirection: "row" }}>
        <Picker
          style={{ flex: 1, backgroundColor: "transparent" }}
          textColor={AppConfig.plainColor}
          itemStyle={{ color: AppConfig.plainColor }}
          selectedValue={currentDate.month()}
          pickerData={months}
          onValueChange={(month) => {
            currentDate.month(month);
            onChangeCalendar();
            setDate(currentDate.clone());
            if (
              props.withEndDate &&
              endDate &&
              startDate.unix() > endDate.unix()
            ) {
              setEndDate(currentDate.clone());
            }
          }}
        />

        <Picker
          style={{ flex: 1, backgroundColor: "transparent" }}
          textColor={AppConfig.plainColor}
          itemStyle={{ color: AppConfig.plainColor }}
          selectedValue={currentDate.year()}
          pickerData={years}
          onValueChange={(year) => {
            currentDate.year(year);
            onChangeCalendar();
            setDate(currentDate.clone());
            if (
              props.withEndDate &&
              endDate &&
              startDate.unix() > endDate.unix()
            ) {
              setEndDate(currentDate.clone());
            }
          }}
        />
      </View>
    );
  };

  const renderTimePicker = () => {
    if (mode === "workingdays" || mode === "nodate") {
      return null;
    }

    const date = isEndTimePicker ? endDate : startDate;
    const setDate = isEndTimePicker ? setEndDate : setStartDate;
    let minHour = 0;
    let maxHour = 23;
    let minMinute = 0;
    let maxMinute = 59;
    const hours = [];
    const minutes = [];

    if (date.format("DD.MM.YYYY") === minimumDate?.format("DD.MM.YYYY")) {
      minHour = minimumDate.hour();
      minMinute = round(minimumDate.minutes(), minuteInterval, true);
    }

    if (date.format("DD.MM.YYYY") === maximumDate?.format("DD.MM.YYYY")) {
      maxHour = maximumDate.hour();
      maxMinute = maximumDate.minute();
    }

    if (
      isEndTimePicker &&
      startDate.format("DD.MM.YYYY") === endDate.format("DD.MM.YYYY")
    ) {
      minHour = startDate.hour();
      minMinute =
        startDate.hours() >= endDate.hours() ? startDate.minutes() : 0;
    }

    for (let hour = minHour; hour <= maxHour; hour++) {
      hours.push({
        value: hour,
        label: hour < 10 ? "0" + hour : hour.toString(),
      });
    }

    for (
      let minute = minMinute;
      minute <= maxMinute;
      minute += minuteInterval
    ) {
      minutes.push({
        value: minute,
        label: minute < 10 ? "0" + minute : minute.toString(),
      });
    }

    return (
      <View key={isEndTimePicker.toString()} style={{ flexDirection: "row" }}>
        <Picker
          style={{ flex: 1, backgroundColor: "transparent" }}
          textColor={AppConfig.plainColor}
          itemStyle={{ color: AppConfig.plainColor }}
          selectedValue={date.hour()}
          pickerData={hours}
          onValueChange={(value) => {
            setDate(date.hours(value).clone());
            if (
              props.withEndDate &&
              endDate &&
              startDate.unix() > endDate.unix()
            ) {
              setEndDate(
                endDate
                  .set({
                    hours: startDate.hours(),
                    minutes: startDate.minutes(),
                  })
                  .clone(),
              );
            }
          }}
        />

        <Picker
          style={{ flex: 1, backgroundColor: "transparent" }}
          textColor={AppConfig.plainColor}
          itemStyle={{ color: AppConfig.plainColor }}
          selectedValue={date.minute()}
          pickerData={minutes}
          onValueChange={(value) => {
            setDate(date.minutes(value).clone());
            if (
              props.withEndDate &&
              endDate &&
              startDate.unix() > endDate.unix()
            ) {
              setEndDate(
                endDate
                  .set({
                    hours: startDate.hours(),
                    minutes: startDate.minutes(),
                  })
                  .clone(),
              );
            }
          }}
        />
      </View>
    );
  };

  const getTimeComponent = (isEndTime: boolean) => {
    let isPicker = isStartTimePicker;
    let date = startDate;
    let setDate = setStartDate;
    let setIsTimePicker = setIsStartTimePicker;
    let hourTextInputRef = startHourTimeTextInputRef;
    let minuteTextInputRef = startMinuteTimeTextInputRef;

    if (isEndTime) {
      isPicker = isEndTimePicker;
      date = endDate;
      setDate = setEndDate;
      setIsTimePicker = setIsEndTimePicker;
      hourTextInputRef = endHourTimeTextInputRef;
      minuteTextInputRef = endMinuteTimeTextInputRef;
    }

    return AppConfig.mac ? (
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={[styles.textWrapper, { flexDirection: "row" }]}>
          <TextInput
            ref={hourTextInputRef}
            keyboardType="numeric"
            value={date.format("HH")}
            onFocus={() => setIsTimePicker(true)}
            selectTextOnFocus
            onChangeText={(value) => {
              if (+value >= 0 && +value <= 23) {
                date.hours(+value);
                setDate(date.clone());

                if (date.hours() > 2) {
                  minuteTextInputRef?.current.focus();
                }
              }
            }}
            onBlur={onBlur}
            style={[styles.text, isPicker && { fontSize: 19, width: 30 }]}
          />
        </View>

        <Text style={[styles.text, isPicker && { fontSize: 19 }]}>:</Text>

        <View style={[styles.textWrapper, { flexDirection: "row" }]}>
          <TextInput
            ref={minuteTextInputRef}
            keyboardType="numeric"
            value={date.format("mm")}
            onFocus={() => setIsTimePicker(true)}
            selectTextOnFocus
            onChangeText={(value) => {
              if (+value >= 0 && +value <= 59) {
                date.minutes(+value);
                setDate(date.clone());
              }
            }}
            onBlur={onBlur}
            style={[styles.text, isPicker && { fontSize: 19, width: 30 }]}
          />
        </View>
      </View>
    ) : (
      <View style={[styles.textWrapper, { flexDirection: "row" }]}>
        <Text style={[styles.text, isPicker && { fontSize: 19 }]}>
          {date.format("HH:mm")}
        </Text>
      </View>
    );
  };

  const getDateComponent = (isEndTime: boolean) => {
    let input = startDateInput;
    let setInput = setStartDateInput;
    let date = startDate;
    let setDate = setStartDate;
    let dateTextInputRef = startDateTimeTextInputRef;

    if (isEndTime) {
      input = endDateInput;
      setInput = setEndDateInput;
      date = endDate;
      setDate = setEndDate;
      dateTextInputRef = endDateTimeTextInputRef;
    }

    return (
      <View style={[styles.textWrapper, { flexDirection: "row", width: 125 }]}>
        <TextInput
          ref={dateTextInputRef}
          keyboardType="numeric"
          value={input}
          selectTextOnFocus
          onChangeText={(value) => {
            let formattedText = value.replace(/[^0-9]/g, "");

            [2, 5].forEach((index) => {
              if (
                formattedText.length > index &&
                formattedText[index] !== "."
              ) {
                formattedText =
                  formattedText.slice(0, index) +
                  "." +
                  formattedText.slice(index);
              }
            });

            if (formattedText.replaceAll(".", "").length > 8) {
              formattedText = formattedText.slice(0, 8);
            }

            setInput(formattedText);

            if (formattedText.length === 10) {
              const [day, month, year] = formattedText.split(".");

              date.set({
                date: +day,
                month: +month - 1, // Отсчёт месяцев начинается с нуля 0
                year: +year,
              });

              setDate(date.clone());

              if (
                date.format("DD.MM.YYYY") !== currentDate.format("DD.MM.YYYY")
              ) {
                currentDate.set({
                  date: +day,
                  month: +month - 1, // Отсчёт месяцев начинается с нуля 0
                  year: +year,
                });

                onChangeCalendar();
              }
            }
          }}
          maxLength={10}
          onBlur={() => {
            onChangeCalendar();
            onBlur();
          }}
          style={[styles.text, { padding: 0, flex: 1 }]}
        />
      </View>
    );
  };

  const renderDateTime = () => {
    if (mode === "workingdays" || mode === "nodate") {
      return null;
    }

    if (props.withEndDate) {
      return (
        <>
          {mode !== "time" ? (
            <View style={[styles.timeContainer, { height: 64 }]}>
              <View style={{ alignItems: "center", paddingTop: 5 }}>
                <Text style={styles.timeText}>{Locale.getItem("начало")}</Text>

                {getDateComponent(false)}
              </View>

              {endDate ? (
                <View style={{ alignItems: "center", paddingTop: 5 }}>
                  <Text style={styles.timeText}>
                    {Locale.getItem("окончание")}
                  </Text>

                  {getDateComponent(true)}
                </View>
              ) : null}
            </View>
          ) : null}
          {mode !== "date" ? (
            <View style={[styles.timeContainer, { height: 64 }]}>
              <TouchableOpacity
                style={{ alignItems: "center", paddingTop: 5 }}
                disabled={AppConfig.mac}
                onPress={() => {
                  setIsMonthYearPicker(false);
                  setIsStartTimePicker(!isStartTimePicker);
                  setIsEndTimePicker(false);
                }}
              >
                <Text style={styles.timeText}>{Locale.getItem("начало")}</Text>

                {getTimeComponent(false)}
              </TouchableOpacity>

              {endDate ? (
                <TouchableOpacity
                  style={{ alignItems: "center", paddingTop: 5 }}
                  disabled={AppConfig.mac}
                  onPress={() => {
                    setIsMonthYearPicker(false);
                    setIsStartTimePicker(false);
                    setIsEndTimePicker(!isEndTimePicker);
                  }}
                >
                  <Text style={styles.timeText}>
                    {Locale.getItem("окончание")}
                  </Text>

                  {getTimeComponent(true)}
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </>
      );
    }

    return (
      <View
        style={[
          styles.timeContainer,
          { alignItems: "center" },
          mode !== "datetime" && { justifyContent: "center" },
        ]}
      >
        {mode !== "time" ? getDateComponent(false) : null}

        {mode !== "date" ? (
          <TouchableOpacity
            disabled={AppConfig.mac}
            onPress={() => {
              setIsMonthYearPicker(false);
              setIsStartTimePicker(!isStartTimePicker);
              setIsEndTimePicker(false);
            }}
          >
            {getTimeComponent(false)}
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  const getNumEnding = (iNumber, aEndings) => {
    if (iNumber % 10 === 1 && iNumber % 100 !== 11) {
      return aEndings[0];
    }
    if (
      iNumber % 10 >= 2 &&
      iNumber % 10 <= 4 &&
      (iNumber % 100 < 10 || iNumber % 100 >= 20)
    ) {
      return aEndings[1];
    }
    return aEndings[2];
  };

  const renderWorkingDays = () => (
    <View style={styles.workingDaysWrapper}>
      <View style={[styles.textWrapper, { minWidth: 70 }]}>
        <TextInput
          keyboardType="numeric"
          value={workingDays.toString()}
          selectTextOnFocus
          onChangeText={(value) =>
            setWorkingDays(+value.replace(/[^0-9]/g, ""))
          }
          maxLength={10}
          style={styles.text}
        />
      </View>
      <View style={{ width: 140 }}>
        <Text style={[styles.text, { textAlign: "left", marginLeft: 15 }]}>
          {Locale.getItem(
            getNumEnding(workingDays, [
              "рабочий день",
              "рабочих дня",
              "рабочих дней",
            ]),
          )}
        </Text>
      </View>
    </View>
  );

  const renderSegmentedControl = () => {
    if (!props.actions?.length) {
      return null;
    }

    return (
      <View style={styles.actionsContainer}>
        <SegmentedControl
          config={AppConfig}
          values={props.actions}
          selectedIndex={selectedActionIndex}
          onTabPress={(action, index) => {
            if (selectedActionIndex === index) {
              setSelectedActionIndex(-1);
              setMode(props.mode || "date");
            } else {
              setSelectedActionIndex(index);
              setMode(action.mode);
            }
          }}
        />
      </View>
    );
  };

  const renderButtons = () => (
    <View style={styles.buttonsContainer}>
      {!AppConfig.mac &&
        (isMonthYearPicker || isStartTimePicker || isEndTimePicker) ? (
        <TouchableOpacity
          style={styles.buttonWrapper}
          onPress={() => {
            setIsMonthYearPicker(false);
            setIsStartTimePicker(false);
            setIsEndTimePicker(false);
            if (!props.withEndDate) {
              startDate.set({
                month: currentDate.month(),
                year: currentDate.year(),
              });
            }
            onBlur();
          }}
        >
          <Text style={[styles.text, { color: AppConfig.mainColor }]}>
            {Locale.getItem("Выбрать")}
          </Text>
        </TouchableOpacity>
      ) : (
        <>
          <TouchableOpacity
            style={styles.buttonWrapper}
            onPress={props.onCancel}
          >
            <Text style={[styles.text, { color: AppConfig.errorColor }]}>
              {Locale.getItem("Отмена")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buttonWrapper}
            onPress={() => {
              onBlur();
              onConfirm(startDate.toDate(), endDate?.toDate());
            }}
          >
            <Text style={[styles.text, { color: AppConfig.mainColor }]}>
              {Locale.getItem("OK")}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  if (minimumDate > maximumDate) {
    props.hidePicker();
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        ["time", "workingdays", "nodate"].includes(mode) && { minHeight: 0 },
        isKeyboardOpen && AppConfig.iOS && { bottom: 300 },
      ]}
    >
      {["date", "datetime"].includes(mode) ? (
        <>
          {renderHeader()}

          {AppConfig.mac ||
            (!isMonthYearPicker && !isStartTimePicker && !isEndTimePicker)
            ? renderCalendar()
            : null}

          {!AppConfig.mac && isMonthYearPicker ? renderMonthYearPicker() : null}
        </>
      ) : null}

      {!AppConfig.mac &&
        ((mode === "time" && !props.withEndDate) ||
          isStartTimePicker ||
          isEndTimePicker)
        ? renderTimePicker()
        : null}

      <View>
        {!AppConfig.mac && mode === "time" && !props.withEndDate
          ? null
          : renderDateTime()}

        {mode === "workingdays" ? renderWorkingDays() : null}

        {renderSegmentedControl()}

        {renderButtons()}
      </View>
    </View>
  );
};

const DatePicker: React.FunctionComponent<IDatePickerProps> = (props) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (props.isVisible) {
      showPicker();
    }
  }, [props.isVisible]);

  const showPicker = () => setIsVisible(true);

  const hidePicker = () => setIsVisible(false);

  const onCancel = () => {
    hidePicker();
    if (props.onCancel) {
      props.onCancel();
    }
  };

  return (
    <>
      {props.children ? props.children(showPicker) : null}
      <Modal
        animationIn="slideInUp"
        animationOut="slideOutDown"
        isVisible={isVisible}
        useNativeDriver
        onBackButtonPress={onCancel}
        onBackdropPress={onCancel}
        onModalHide={onCancel}
        style={{ flex: 1, margin: 0 }}
      >
        <DatePickerModal
          {...props}
          hidePicker={hidePicker}
          onCancel={onCancel}
        />
      </Modal>
    </>
  );
};

export default DatePicker;
