import { VolunteerModel } from "../models/volunteerModel.js";

export const volunteerService = {
  addVolunteer: async (data) => {
    return await VolunteerModel.add(data);
  }
};

export default volunteerService;
