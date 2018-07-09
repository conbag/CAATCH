import {combineReducers} from 'redux';
import {UPDATE_COPING, GET_COPING} from "./actions";

const copingReducer = (state = [], action) => {
    if(action.type === UPDATE_COPING) {
        return [...state, action.payload];
    }
    // used for when a new coping strategy is added

    if(action.type === GET_COPING) {
        return action.payload
    }
    // used to get the complete coping strategy list from the DB

    // if(action.type === UPDATE_PREPOP_COPE) {
    //     return [...state, {prepop: action.payload}]
    // }
    // // used to get the selected pre-populated coping strategy from list screen

    return state
};

const reducer = combineReducers({
    coping: copingReducer
});
// as reducers grow, add to this object

export default reducer;