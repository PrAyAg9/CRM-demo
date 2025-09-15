import React, { useState, useCallback } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import {
  PlusIcon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import classnames from "classnames";

export interface Rule {
  id: string;
  field: string;
  operator: string;
  value: string | number;
  type: "string" | "number" | "date" | "boolean";
}

export interface RuleGroup {
  id: string;
  logic: "AND" | "OR";
  rules: (Rule | RuleGroup)[];
}

interface RuleBuilderProps {
  initialRules?: RuleGroup;
  onChange: (rules: RuleGroup) => void;
  onPreview?: (rules: RuleGroup) => void;
  customerCount?: number;
  isLoading?: boolean;
}

const FIELD_OPTIONS = [
  { value: "firstName", label: "First Name", type: "string" },
  { value: "lastName", label: "Last Name", type: "string" },
  { value: "email", label: "Email", type: "string" },
  { value: "phone", label: "Phone", type: "string" },
  { value: "totalSpent", label: "Total Spent", type: "number" },
  { value: "orderCount", label: "Order Count", type: "number" },
  { value: "lastOrderDate", label: "Last Order Date", type: "date" },
  { value: "createdAt", label: "Customer Since", type: "date" },
  { value: "status", label: "Status", type: "string" },
  { value: "location.city", label: "City", type: "string" },
  { value: "location.state", label: "State", type: "string" },
  { value: "location.country", label: "Country", type: "string" },
  { value: "preferences.channel", label: "Preferred Channel", type: "string" },
  { value: "lastEngagementAt", label: "Last Engagement", type: "date" },
];

const OPERATORS = {
  string: [
    { value: "equals", label: "equals" },
    { value: "not_equals", label: "does not equal" },
    { value: "contains", label: "contains" },
    { value: "not_contains", label: "does not contain" },
    { value: "starts_with", label: "starts with" },
    { value: "ends_with", label: "ends with" },
    { value: "is_empty", label: "is empty" },
    { value: "is_not_empty", label: "is not empty" },
  ],
  number: [
    { value: "equals", label: "equals" },
    { value: "not_equals", label: "does not equal" },
    { value: "greater_than", label: "greater than" },
    { value: "greater_than_or_equal", label: "greater than or equal" },
    { value: "less_than", label: "less than" },
    { value: "less_than_or_equal", label: "less than or equal" },
    { value: "between", label: "between" },
  ],
  date: [
    { value: "equals", label: "equals" },
    { value: "not_equals", label: "does not equal" },
    { value: "after", label: "after" },
    { value: "before", label: "before" },
    { value: "between", label: "between" },
    { value: "last_n_days", label: "last N days" },
    { value: "next_n_days", label: "next N days" },
  ],
  boolean: [
    { value: "is_true", label: "is true" },
    { value: "is_false", label: "is false" },
  ],
};

const RuleBuilder: React.FC<RuleBuilderProps> = ({
  initialRules,
  onChange,
  onPreview,
  customerCount,
  isLoading,
}) => {
  const [rules, setRules] = useState<RuleGroup>(
    initialRules || {
      id: "root",
      logic: "AND",
      rules: [],
    }
  );

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const updateRules = useCallback(
    (newRules: RuleGroup) => {
      setRules(newRules);
      onChange(newRules);
    },
    [onChange]
  );

  const addRule = (groupId: string) => {
    const newRule: Rule = {
      id: generateId(),
      field: "firstName",
      operator: "equals",
      value: "",
      type: "string",
    };

    const updatedRules = addRuleToGroup(rules, groupId, newRule);
    updateRules(updatedRules);
  };

  const addGroup = (parentGroupId: string) => {
    const newGroup: RuleGroup = {
      id: generateId(),
      logic: "AND",
      rules: [],
    };

    const updatedRules = addRuleToGroup(rules, parentGroupId, newGroup);
    updateRules(updatedRules);
  };

  const removeRule = (groupId: string, ruleId: string) => {
    const updatedRules = removeRuleFromGroup(rules, groupId, ruleId);
    updateRules(updatedRules);
  };

  const updateRule = (
    groupId: string,
    ruleId: string,
    updates: Partial<Rule>
  ) => {
    const updatedRules = updateRuleInGroup(rules, groupId, ruleId, updates);
    updateRules(updatedRules);
  };

  const updateGroupLogic = (groupId: string, logic: "AND" | "OR") => {
    const updatedRules = updateGroupLogicInGroup(rules, groupId, logic);
    updateRules(updatedRules);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    // Implementation for drag and drop reordering
    // This would require more complex logic to handle moving rules between groups
    console.log("Drag ended:", result);
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview(rules);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Segment Rules</h3>
        <div className="flex space-x-3">
          {onPreview && (
            <button
              onClick={handlePreview}
              disabled={isLoading}
              className="btn-secondary flex items-center space-x-2"
            >
              {isLoading ? (
                <div className="spinner"></div>
              ) : (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
              <span>Preview ({customerCount || 0} customers)</span>
            </button>
          )}
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <RuleGroupComponent
            group={rules}
            onAddRule={addRule}
            onAddGroup={addGroup}
            onRemoveRule={removeRule}
            onUpdateRule={updateRule}
            onUpdateGroupLogic={updateGroupLogic}
            isRoot={true}
          />
        </div>
      </DragDropContext>

      {/* Query Preview */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Generated Query Preview
        </h4>
        <pre className="text-xs text-gray-600 overflow-x-auto">
          {JSON.stringify(convertToMongoQuery(rules), null, 2)}
        </pre>
      </div>
    </div>
  );
};

interface RuleGroupComponentProps {
  group: RuleGroup;
  onAddRule: (groupId: string) => void;
  onAddGroup: (groupId: string) => void;
  onRemoveRule: (groupId: string, ruleId: string) => void;
  onUpdateRule: (
    groupId: string,
    ruleId: string,
    updates: Partial<Rule>
  ) => void;
  onUpdateGroupLogic: (groupId: string, logic: "AND" | "OR") => void;
  isRoot?: boolean;
}

const RuleGroupComponent: React.FC<RuleGroupComponentProps> = ({
  group,
  onAddRule,
  onAddGroup,
  onRemoveRule,
  onUpdateRule,
  onUpdateGroupLogic,
  isRoot = false,
}) => {
  return (
    <div
      className={classnames(
        "space-y-4",
        !isRoot && "border border-gray-200 rounded-lg p-4 bg-gray-50"
      )}
    >
      {!isRoot && (
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Match</span>
          <select
            value={group.logic}
            onChange={(e) =>
              onUpdateGroupLogic(group.id, e.target.value as "AND" | "OR")
            }
            className="form-input text-sm"
          >
            <option value="AND">ALL</option>
            <option value="OR">ANY</option>
          </select>
          <span className="text-sm text-gray-600">
            of the following conditions:
          </span>
        </div>
      )}

      <Droppable droppableId={group.id}>
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-3"
          >
            {group.rules.map((rule, index) => (
              <Draggable key={rule.id} draggableId={rule.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={classnames(
                      "transition-transform",
                      snapshot.isDragging && "transform rotate-2 shadow-lg"
                    )}
                  >
                    {"field" in rule ? (
                      <RuleComponent
                        rule={rule}
                        onUpdate={(updates) =>
                          onUpdateRule(group.id, rule.id, updates)
                        }
                        onRemove={() => onRemoveRule(group.id, rule.id)}
                      />
                    ) : (
                      <RuleGroupComponent
                        group={rule}
                        onAddRule={onAddRule}
                        onAddGroup={onAddGroup}
                        onRemoveRule={onRemoveRule}
                        onUpdateRule={onUpdateRule}
                        onUpdateGroupLogic={onUpdateGroupLogic}
                      />
                    )}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <div className="flex space-x-2">
        <button
          onClick={() => onAddRule(group.id)}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Rule
        </button>
        <button
          onClick={() => onAddGroup(group.id)}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Group
        </button>
      </div>
    </div>
  );
};

interface RuleComponentProps {
  rule: Rule;
  onUpdate: (updates: Partial<Rule>) => void;
  onRemove: () => void;
}

const RuleComponent: React.FC<RuleComponentProps> = ({
  rule,
  onUpdate,
  onRemove,
}) => {
  const fieldOption = FIELD_OPTIONS.find((f) => f.value === rule.field);
  const operators =
    OPERATORS[(fieldOption?.type as keyof typeof OPERATORS) || "string"];

  const handleFieldChange = (field: string) => {
    const fieldOption = FIELD_OPTIONS.find((f) => f.value === field);
    const newType = fieldOption?.type || "string";
    const newOperator =
      OPERATORS[newType as keyof typeof OPERATORS][0]?.value || "equals";

    onUpdate({
      field,
      type: newType as "string" | "number" | "boolean" | "date",
      operator: newOperator,
      value: "",
    });
  };

  const renderValueInput = () => {
    const needsValue = ![
      "is_empty",
      "is_not_empty",
      "is_true",
      "is_false",
    ].includes(rule.operator);

    if (!needsValue) return null;

    switch (rule.type) {
      case "number":
        return (
          <input
            type="number"
            value={rule.value}
            onChange={(e) =>
              onUpdate({ value: parseFloat(e.target.value) || 0 })
            }
            className="form-input"
            placeholder="Enter number"
          />
        );
      case "date":
        return (
          <input
            type="date"
            value={rule.value}
            onChange={(e) => onUpdate({ value: e.target.value })}
            className="form-input"
          />
        );
      case "boolean":
        return null; // Boolean operators don't need value input
      default:
        return (
          <input
            type="text"
            value={rule.value}
            onChange={(e) => onUpdate({ value: e.target.value })}
            className="form-input"
            placeholder="Enter value"
          />
        );
    }
  };

  return (
    <div className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg">
      {/* Field Selection */}
      <select
        value={rule.field}
        onChange={(e) => handleFieldChange(e.target.value)}
        className="form-input min-w-0 flex-1"
      >
        {FIELD_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Operator Selection */}
      <select
        value={rule.operator}
        onChange={(e) => onUpdate({ operator: e.target.value })}
        className="form-input min-w-0 flex-1"
      >
        {operators.map((op: { value: string; label: string }) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>

      {/* Value Input */}
      <div className="flex-1">{renderValueInput()}</div>

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

// Helper functions
function addRuleToGroup(
  group: RuleGroup,
  targetGroupId: string,
  newRule: Rule | RuleGroup
): RuleGroup {
  if (group.id === targetGroupId) {
    return {
      ...group,
      rules: [...group.rules, newRule],
    };
  }

  return {
    ...group,
    rules: group.rules.map((rule) =>
      "rules" in rule ? addRuleToGroup(rule, targetGroupId, newRule) : rule
    ),
  };
}

function removeRuleFromGroup(
  group: RuleGroup,
  targetGroupId: string,
  ruleId: string
): RuleGroup {
  if (group.id === targetGroupId) {
    return {
      ...group,
      rules: group.rules.filter((rule) => rule.id !== ruleId),
    };
  }

  return {
    ...group,
    rules: group.rules.map((rule) =>
      "rules" in rule ? removeRuleFromGroup(rule, targetGroupId, ruleId) : rule
    ),
  };
}

function updateRuleInGroup(
  group: RuleGroup,
  targetGroupId: string,
  ruleId: string,
  updates: Partial<Rule>
): RuleGroup {
  if (group.id === targetGroupId) {
    return {
      ...group,
      rules: group.rules.map((rule) =>
        rule.id === ruleId && "field" in rule ? { ...rule, ...updates } : rule
      ),
    };
  }

  return {
    ...group,
    rules: group.rules.map((rule) =>
      "rules" in rule
        ? updateRuleInGroup(rule, targetGroupId, ruleId, updates)
        : rule
    ),
  };
}

function updateGroupLogicInGroup(
  group: RuleGroup,
  targetGroupId: string,
  logic: "AND" | "OR"
): RuleGroup {
  if (group.id === targetGroupId) {
    return { ...group, logic };
  }

  return {
    ...group,
    rules: group.rules.map((rule) =>
      "rules" in rule
        ? updateGroupLogicInGroup(rule, targetGroupId, logic)
        : rule
    ),
  };
}

function convertToMongoQuery(group: RuleGroup): any {
  const conditions = group.rules.map((rule) => {
    if ("field" in rule) {
      return convertRuleToMongo(rule);
    } else {
      return convertToMongoQuery(rule);
    }
  });

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0];

  return { [`$${group.logic.toLowerCase()}`]: conditions };
}

function convertRuleToMongo(rule: Rule): any {
  const { field, operator, value } = rule;

  switch (operator) {
    case "equals":
      return { [field]: value };
    case "not_equals":
      return { [field]: { $ne: value } };
    case "contains":
      return { [field]: { $regex: value, $options: "i" } };
    case "not_contains":
      return { [field]: { $not: { $regex: value, $options: "i" } } };
    case "starts_with":
      return { [field]: { $regex: `^${value}`, $options: "i" } };
    case "ends_with":
      return { [field]: { $regex: `${value}$`, $options: "i" } };
    case "greater_than":
      return { [field]: { $gt: value } };
    case "greater_than_or_equal":
      return { [field]: { $gte: value } };
    case "less_than":
      return { [field]: { $lt: value } };
    case "less_than_or_equal":
      return { [field]: { $lte: value } };
    case "is_empty":
      return {
        $or: [
          { [field]: null },
          { [field]: "" },
          { [field]: { $exists: false } },
        ],
      };
    case "is_not_empty":
      return { [field]: { $exists: true, $nin: [null, ""] } };
    case "is_true":
      return { [field]: true };
    case "is_false":
      return { [field]: false };
    default:
      return { [field]: value };
  }
}

export default RuleBuilder;
