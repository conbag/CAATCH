import React from 'react';
import { createStackNavigator } from 'react-navigation';
import Ionicons from "react-native-vector-icons/Ionicons";
import {Icons} from "../../Constants/Icon";

import HomeScreen from "../../Screens/HomeScreen";
import Schedule from "../../Screens/ScheduleScreens/Schedule";
import NewSchedule from "../../Screens/ScheduleScreens/NewSchedule";
import VicChart from "../../Screens/StatScreens/VicChart";
import StatSelection from "../../Screens/StatScreens/StatSelection";
import Insights from "../../Screens/StatScreens/Insights";
import VicSkillsChart from "../../Screens/StatScreens/VicSkillsChart";
import Goals from "../../Screens/GoalScreens/Goals";
import NewGoal from "../../Screens/GoalScreens/NewGoal";
import DiaryItemList from "../../Screens/GoalScreens/DiaryItemList";
import GoalSummary from "../../Screens/GoalScreens/GoalSummary";
import EditGoal from "../../Screens/GoalScreens/EditGoal";
import ReportSelection from "../../Screens/ReportScreens/ReportSelection";
import SafetyPlanReport from "../../Screens/ReportScreens/SafetyPlanReport";
import DiaryReport from "../../Screens/ReportScreens/DiaryReport";
import {Stacks, themeStyles} from "../../Styles/TabStyles";

const HomeStack = createStackNavigator(
    {
        main: HomeScreen,
        schedule: Schedule,
        newSchedule: NewSchedule,
        statSelection: StatSelection,
        insights: Insights,
        victory: VicChart,
        vicSkills: VicSkillsChart,
        reportSelection: ReportSelection,
        spReport: SafetyPlanReport,
        diaryReport: DiaryReport,
        goals: Goals,
        newGoal: NewGoal,
        diaryItemList: DiaryItemList,
        goalSummary: GoalSummary,
        editGoal: EditGoal
    },

    {
        initialRouteName: "main",
        ...Stacks

    }
);
// Home stack navigator

HomeStack.navigationOptions = {
    tabBarIcon: ({ focused, tintColor }) => (
        <Ionicons
            name={Icons.home + `${focused ? "" : "-outline"}`}
            // if icon is not pressed use outline
            size={25}
            color={tintColor}
        />
    ),
};
// setting tab icon of Home Stack to home icon

export default HomeStack;