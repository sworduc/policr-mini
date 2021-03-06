import React, { useEffect, useState } from "react";
import useSWR from "swr";
import { useSelector, useDispatch } from "react-redux";
import { Link as RouteLink, useLocation } from "react-router-dom";
import tw, { styled } from "twin.macro";
import Select from "react-select";
import {
  parseISO,
  format as formatDateTime,
} from "date-fns";

import {
  PageHeader,
  PageLoading,
  PageReLoading,
  PageSection,
  PageSectionHeader,
  PageSectionTitle,
  PageBody,
  Pagination,
} from "../components";
import { Table, Thead, Tr, Th, Tbody, Td } from "../components/Tables";
import { loadSelected } from "../slices/chats";
import { toastErrors } from "../helper";

const TimeLink = styled(RouteLink)`
  ${tw`no-underline text-orange-600 hover:text-orange-400`}
  ${({ selected }) => (selected ? tw`text-black hover:text-black` : undefined)}
`;

const defaultRoleOption = { value: "all", label: "不限" };
const roleOptions = [
  defaultRoleOption,
  { value: "system", label: "系统" },
  { value: "admin", label: "管理员" },
];

const defaultActionOption = { value: "all", label: "不限" };
const actionOptions = [
  defaultActionOption,
  { value: "kick", label: "踢出" },
  { value: "ban", label: "封禁" },
];

function findRoleOption(value) {
  const options = roleOptions.filter((option) => option.value === value);

  if (options.length == 0) return defaultRoleOption;
  else return options[0];
}

function findActionOption(value) {
  const options = actionOptions.filter((option) => option.value === value);

  if (options.length == 0) return defaultRoleOption;
  else return options[0];
}

function parseOffset(offset) {
  if (offset) {
    try {
      return parseInt(offset);
    } catch (error) {
      return 0;
    }
  } else return 0;
}

function parseTimeRange(timeRange) {
  if (["1d", "1w", "2w", "1m"].includes(timeRange)) return timeRange;
  else return "1d";
}
function parseRole(role) {
  if (["all", "system", "admin"].includes(role)) return role;
  else return "all";
}
function parseAction(action) {
  if (["all", "kick", "ban"].includes(action)) return action;
  else return "all";
}

function makeQueryString({ role, action, timeRange, offset }) {
  role = parseRole(role);
  action = parseAction(action);
  timeRange = parseTimeRange(timeRange);
  offset = parseOffset(offset);

  let queryString = `?timeRange=${timeRange}&offset=${offset}`;
  if (role != "all") queryString += `&role=${role}`;
  if (action != "all") queryString += `&action=${action}`;

  return queryString;
}

function roleUI(role) {
  let color;
  let text;
  switch (role) {
    case "system":
      color = "green";
      text = "系统";
      break;
    case "admin":
      color = "red";
      text = "管理员";
      break;

    default:
      text = "未知";
  }

  return <span style={{ color: color }}>{text}</span>;
}

function actionUI(action) {
  let color;
  let text;
  switch (action) {
    case "kick":
      color = "darkkhaki";
      text = "踢出";
      break;
    case "ban":
      color = "red";
      text = "封禁";
      break;

    default:
      text = "未知";
  }

  return <span style={{ color: color }}>{text}</span>;
}

const dateTimeFormat = "yyyy-MM-dd HH:mm:ss";

const makeEndpoint = (chatId, queryString) =>
  `/admin/api/chats/${chatId}/operations${queryString}`;

export default () => {
  const dispatch = useDispatch();
  const location = useLocation();

  const chatsState = useSelector((state) => state.chats);
  const searchParams = new URLSearchParams(location.search);

  const role = searchParams.get("role");
  const action = searchParams.get("action");
  const timeRange = parseTimeRange(searchParams.get("timeRange"));
  const offset = parseOffset(searchParams.get("offset"));
  const apiQueryString = makeQueryString({ role, action, timeRange, offset });

  const [roleOption, setRoleOption] = useState(findRoleOption(role));
  const [actionOption, setActionOption] = useState(findActionOption(action));

  const { data, error, mutate } = useSWR(
    chatsState && chatsState.isLoaded && chatsState.selected
      ? makeEndpoint(chatsState.selected, apiQueryString)
      : null
  );

  const isLoaded = () => chatsState.isLoaded && !error && data && !data.errors;

  let title = "操作记录";
  if (isLoaded()) title += ` / ${data.chat.title}`;

  useEffect(() => {
    if (data && data.errors) toastErrors(data.errors);
    if (isLoaded()) dispatch(loadSelected(data.chat));
  }, [data]);

  return (
    <>
      <PageHeader title={title} />
      <PageBody>
        <PageSection>
          <PageSectionHeader>
            <PageSectionTitle>过滤器</PageSectionTitle>
          </PageSectionHeader>
          <main>
            <div tw="flex py-2">
              <div tw="w-4/12 flex items-center">
                <span>角色：</span>
                <div css={{ width: "5.5rem" }}>
                  <Select
                    value={roleOption}
                    options={roleOptions}
                    isSearchable={false}
                  />
                </div>
              </div>
              <div tw="w-4/12 flex items-center">
                <span>动作：</span>
                <div css={{ width: "5.5rem" }}>
                  <Select
                    value={actionOption}
                    options={actionOptions}
                    isSearchable={false}
                  />
                </div>
              </div>
              <div tw="w-8/12 flex items-center justify-around">
                <span>显示过去时间范围的情况：</span>
                <TimeLink
                  to={makeQueryString({
                    status: roleOption.value,
                    timeRange: "1d",
                    offset: offset,
                  })}
                  selected={timeRange == "1d"}
                >
                  1 天
                </TimeLink>
                <TimeLink
                  to={makeQueryString({
                    status: roleOption.value,
                    timeRange: "1w",
                    offset: offset,
                  })}
                  selected={timeRange == "1w"}
                >
                  1 周
                </TimeLink>
                <TimeLink
                  to={makeQueryString({
                    status: roleOption.value,
                    timeRange: "2w",
                    offset: offset,
                  })}
                  selected={timeRange == "2w"}
                >
                  2 周
                </TimeLink>
                <TimeLink
                  to={makeQueryString({
                    status: roleOption.value,
                    timeRange: "1m",
                    offset: offset,
                  })}
                  selected={timeRange == "1m"}
                >
                  1 月
                </TimeLink>
              </div>
            </div>
          </main>
        </PageSection>
        <PageSection>
          <PageSectionHeader>
            <PageSectionTitle>操作列表</PageSectionTitle>
          </PageSectionHeader>
          <main>
            {isLoaded() ? (
              <div tw="shadow rounded">
                <Table tw="mt-3">
                  <Thead>
                    <Tr>
                      <Th tw="w-2/12">用户名称</Th>
                      <Th tw="w-3/12">加入日期</Th>
                      <Th tw="w-2/12 text-center">操作人角色</Th>
                      <Th tw="w-2/12 text-center">执行动作</Th>
                      <Th tw="w-3/12 text-right">操作日期</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {data.operations.map((o, i) => (
                      <Tr key={o.id}>
                        <Td tw="truncate">{o.verification.targetUserName}</Td>
                        <Td>
                          {formatDateTime(
                            parseISO(o.verification.insertedAt),
                            dateTimeFormat
                          )}
                        </Td>
                        <Td tw="text-center">{roleUI(o.role)}</Td>
                        <Td tw="text-center">{actionUI(o.action)}</Td>
                        <Td tw="text-right">
                          {formatDateTime(
                            parseISO(o.insertedAt),
                            dateTimeFormat
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
                <Pagination
                  begin={offset + 1}
                  ending={offset + data.operations.length}
                  linkify={true}
                  upTo={makeQueryString({
                    status: role,
                    timeRange,
                    offset: offset < 25 ? 0 : offset - 25,
                  })}
                  downTo={makeQueryString({
                    status: role,
                    timeRange,
                    offset: offset + 25,
                  })}
                />
              </div>
            ) : error ? (
              <PageReLoading mutate={mutate} />
            ) : (
              <PageLoading />
            )}
          </main>
        </PageSection>
      </PageBody>
    </>
  );
};
