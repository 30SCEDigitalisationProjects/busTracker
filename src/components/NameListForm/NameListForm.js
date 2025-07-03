import { useEffect, useState } from "react";

import dayjs from "dayjs";
import {
  Button,
  Form,
  Select,
  Spin,
  message,
  Steps,
  Popconfirm,
  Input,
} from "antd";
import { LoadingOutlined } from "@ant-design/icons";

import { formatActivityList } from "../../utils/formUtils";
import {
  saveToLocal,
  getFromLocal,
  updateAttendance,
  removeFromLocal,
} from "../../utils/googleSheetAPI";
import { CONSTANTS } from "../../utils/constants";

import "./NameListForm.css";

const stages = [
  {
    title: "Arrived at School",
  },
  {
    title: "Left School, En Route to Padang",
  },
  {
    title: "Arrived at Padang",
  },
  {
    title: "Seated at Seating Gallery",
  },
  {
    title: "Left Seating Gallery",
  },
  {
    title: "Reached Bus PUDO",
  },
  {
    title: "Left Bus PUDO, En Route to School",
  },
  {
    title: "Returned to School",
  },
];

const NameListForm = () => {
  const [form] = Form.useForm();
  const [schoolList, setSchoolList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tripStatus, setTripStatus] = useState(() => {
    const saved = getFromLocal(CONSTANTS.FORM_ITEM_KEYS.TRIP_STATUS);
    return saved !== null ? Number(saved) : CONSTANTS.TRIP_STATUS.PRE_TRIP;
  });
  const [canUpdateTripStatus, setCanUpdateTripStatus] = useState(false);

  useEffect(() => {
    const populateSchoolList = async () => {
      setIsLoading(true);
      const data = await formatActivityList(CONSTANTS.SHEETS.NE_OPS);
      setSchoolList(data);
      // console.log(data);
      setIsLoading(false);
    };
    populateSchoolList();
  }, []);

  const onSchoolChange = (event) => {
    console.log(event);
  };

  const onTripStatusChange = (newTripStatus) => {
    const currentTripStatus = Number(
      getFromLocal(CONSTANTS.FORM_ITEM_KEYS.TRIP_STATUS)
    );
    console.log("currentValue", CONSTANTS.CELLS[currentTripStatus]);
    console.log("newValue", CONSTANTS.CELLS[newTripStatus]);
    setTripStatus(newTripStatus);
    if (currentTripStatus !== newTripStatus) {
      setCanUpdateTripStatus(true);
    } else {
      setCanUpdateTripStatus(false);
    }
  };

  const onUpdateTripStatus = async () => {
    setIsLoading(true);
    console.log("Update trip status");
    const currentTripStatus = Number(
      getFromLocal(CONSTANTS.FORM_ITEM_KEYS.TRIP_STATUS)
    );
    const logMessage = `From ${CONSTANTS.CELLS[currentTripStatus]} change to ${CONSTANTS.CELLS[tripStatus]}`;
    console.log(logMessage);

    const data = {
      row: Number(getFromLocal(CONSTANTS.FORM_ITEM_KEYS.SCHOOL_ROW)),
      toIncrease: CONSTANTS.CELLS[tripStatus],
      toDecrease: CONSTANTS.CELLS[currentTripStatus],
    };

    const isSuccess = await updateAttendance(CONSTANTS.SHEETS.NE_OPS, data);
    if (!isSuccess) {
      message.error("Failed to send data.");
      return;
    }
    saveToLocal(CONSTANTS.FORM_ITEM_KEYS.TRIP_STATUS, tripStatus);
    message.success("Successfully sent data.");
    setCanUpdateTripStatus(false);
    setIsLoading(false);
  };

  const onFinish = async (values) => {
    setIsLoading(true);
    // console.log(values);
    saveToLocal(
      CONSTANTS.FORM_ITEM_KEYS.TRIP_STATUS,
      CONSTANTS.TRIP_STATUS.ARRIVED_AT_SCHOOL_START
    );
    saveToLocal(CONSTANTS.FORM_ITEM_KEYS.SCHOOL_NAME, values["school"].label);
    saveToLocal(CONSTANTS.FORM_ITEM_KEYS.SCHOOL_ROW, values["school"].value);
    setTripStatus(CONSTANTS.TRIP_STATUS.ARRIVED_AT_SCHOOL_START);

    const data = {
      row: values["school"].value,
      toIncrease:
        CONSTANTS.CELLS[CONSTANTS.TRIP_STATUS.ARRIVED_AT_SCHOOL_START],
      toDecrease: null,
    };

    const isSuccess = await updateAttendance(CONSTANTS.SHEETS.NE_OPS, data);
    if (!isSuccess) {
      message.error("Failed to send data.");
      return;
    }
    message.success("Successfully sent data.");
    setIsLoading(false);
  };

  const onEndTrip = () => {
    form.resetFields();
    removeFromLocal(CONSTANTS.FORM_ITEM_KEYS.TRIP_STATUS);
    removeFromLocal(CONSTANTS.FORM_ITEM_KEYS.SCHOOL_NAME);
    removeFromLocal(CONSTANTS.FORM_ITEM_KEYS.SCHOOL_ROW);
    setTripStatus(CONSTANTS.TRIP_STATUS.PRE_TRIP);
  };

  return (
    <div className="Form-Style">
      <Spin
        indicator={<LoadingOutlined style={{ fontSize: 48 }} />}
        spinning={isLoading}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={({ "checkbox-group": [] }, { date: dayjs() })}
        >
          <Form.Item
            label="School"
            name="school"
            rules={[
              {
                required: true,
                message: "Please select the school you are asigned to.",
              },
            ]}
          >
            <Select
              showSearch
              labelInValue
              disabled={tripStatus >= 0}
              onChange={onSchoolChange}
              placeholder="Select your assigned school"
              defaultValue={
                tripStatus >= 0
                  ? getFromLocal(CONSTANTS.FORM_ITEM_KEYS.SCHOOL_NAME)
                  : ""
              }
              optionFilterProp="label"
              options={schoolList}
            />
          </Form.Item>
          {tripStatus === CONSTANTS.TRIP_STATUS.PRE_TRIP && (
            <Form.Item>
              <Button block type="primary" htmlType="submit">
                START TRIP
              </Button>
            </Form.Item>
          )}
          {tripStatus !== CONSTANTS.TRIP_STATUS.PRE_TRIP && (
            <div>
              <Form.Item>
                <Input
                  disabled
                  value={`BUS ${getFromLocal(
                    CONSTANTS.FORM_ITEM_KEYS.SCHOOL_NAME
                  )
                    .trim()
                    .split(" ")
                    .pop()}`}
                />
              </Form.Item>
              <Steps
                direction="vertical"
                current={tripStatus}
                items={stages}
                onChange={onTripStatusChange}
              />
              <Form.Item>
                <Button
                  block
                  type="primary"
                  disabled={!canUpdateTripStatus}
                  onClick={onUpdateTripStatus}
                >
                  UPDATE TRIP STATUS
                </Button>
              </Form.Item>
              <Form.Item>
                <Popconfirm
                  title="End Trip"
                  description="Are you sure you want to end this trip?"
                  onConfirm={onEndTrip}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button block danger type="primary">
                    END TRIP
                  </Button>
                </Popconfirm>
              </Form.Item>
            </div>
          )}
        </Form>
      </Spin>
    </div>
  );
};

export default NameListForm;
