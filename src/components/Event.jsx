import { useState } from "react";

const Event = (props) => {
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(props.event.name);
  const [block, setBlock] = useState(props.event.block);
  const [group, setGroup] = useState(props.event.group);
  const [description, setDescription] = useState(props.event.description);
  const [resource, setResource] = useState("");
  const [resourceName, setResourceName] = useState("");
  const [resources, setResources] = useState(props.event.resources || []);

  const editEvent = async (e) => {
    e.preventDefault();
    await props.editEvent(props.event.id, {
      name,
      group,
      block,
      description,
      resources,
    });
    setEdit(false);
  };

  const deleteEvent = async () => {
    await props.deleteEvent(props.event.id);
  };

  const addResource = () => {
    if (resource.trim() && resourceName.trim()) {
      setResources(resources.concat({ 
        name: resourceName.trim(), 
        url: resource.trim() 
      }));
      setResource("");
      setResourceName("");
    }
  };

  if (edit) {
    return (
      <li className="p-4 bg-white rounded-md shadow-sm border border-orange-200">
        <form onSubmit={editEvent}>
          <div className="flex justify-between items-center">
            <div className="mb-1">
              <input
                value={name}
                onChange={({ target }) => setName(target.value)}
                className="text-lg font-semibold text-orange-700 px-2 py-1 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-orange-600 text-white px-4 py-1 rounded hover:bg-red-700 transition"
              >
                Save
              </button>
              <button
                type="button"
                className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700 transition"
                onClick={() => {
                  setEdit(false);
                  setName(props.event.name);
                  setBlock(props.event.block);
                  setGroup(props.event.group);
                  setDescription(props.event.description);
                  setResource("");
                  setResources(props.event.resources);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-800 mb-3">
            <label className="font-medium block mb-1">Category</label>
            <select
              name="category"
              value={group}
              onChange={({ target }) => setGroup(target.value)}
              className="w-full px-1 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white appearance-none"
            >
              <option value="" disabled hidden>
                Select Category
              </option>
              <option value="Life, Personal & Social Science">
                Life, Personal & Social Science
              </option>
              <option value="Earth And Space Science">
                Earth And Space Science
              </option>
              <option value="Physical Science & Chemistry">
                Physical Science & Chemistry
              </option>
              <option value="Technology & Engineering">
                Technology & Engineering
              </option>
              <option value="Inquiry & Nature of Science">
                Inquiry & Nature of Science
              </option>
            </select>
          </div>

          <div className="text-sm text-gray-800 mb-3">
            <label className="font-medium block mb-1">Block</label>
            <select
              name="block"
              value={block}
              onChange={({ target }) => setBlock(target.value)}
              className="w-full px-1 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white appearance-none"
            >
              <option value="">Self Schedule</option>
              <option value="1">Block 1</option>
              <option value="2">Block 2</option>
              <option value="3">Block 3</option>
              <option value="4">Block 4</option>
              <option value="5">Block 5</option>
            </select>
          </div>
          <div className="text-sm text-gray-800 mb-3">
            <label className="font-medium block mb-1">Description:</label>
            <textarea
              value={description}
              onChange={({ target }) => setDescription(target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
              rows={4}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 mb-1">Resources:</p>
            <div className="flex flex-wrap gap-2">
              {resources.map((r, index) => (
                <div
                  key={index}
                  className="flex items-center bg-orange-100 text-orange-800 text-xs font-medium px-3 py-1 rounded-full shadow hover:bg-orange-200 transition"
                >
                  <a
                    href={typeof r === 'string' ? r : r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate max-w-[140px] hover:underline"
                    title={typeof r === 'string' ? r : r.url}
                  >
                    {typeof r === 'string' ? r : r.name}
                  </a>
                  <button
                    type="button"
                    onClick={() =>
                      setResources(resources.filter((_, i) => i !== index))
                    }
                    className="ml-2 text-gray-500 text-lg hover:text-red-600 font-bold"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-3">
            <label className="block text-sm font-medium text-orange-800 mb-1">
              Add Resource
            </label>
            <div className="flex gap-2 mb-2">
              <input
                placeholder="Resource Name"
                value={resourceName}
                onChange={({ target }) => setResourceName(target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div className="flex gap-2">
              <input
                placeholder="Resource URL"
                value={resource}
                onChange={({ target }) => setResource(target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button
                onClick={addResource}
                type="button"
                className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition"
              >
                Add
              </button>
            </div>
          </div>
        </form>
      </li>
    );
  } else {
    return (
      <li className="p-4 bg-white rounded-md shadow-sm border border-orange-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-orange-700 mb-1">
            {props.event.name}
          </h3>
          {props.user && props.user.admin ? (
            <div className="flex justify-between gap-2">
              <button
                className="bg-orange-600 text-white px-4 py-1 rounded hover:bg-orange-700 transition"
                onClick={() => setEdit(true)}
              >
                Edit
              </button>
              <button
                className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700 transition"
                onClick={deleteEvent}
              >
                Delete
              </button>
            </div>
          ) : null}
        </div>
        <p className="text-sm text-gray-800 mb-1">
          <span className="font-medium">Category:</span> {props.event.group}
        </p>
        <p className="text-sm text-gray-800 mb-1">
          <span className="font-medium">Block:</span>{" "}
          {props.event.block === "" ? "Self Schedule" : props.event.block}
        </p>
        <p className="text-sm text-gray-800 mb-3">
          <span className="font-medium">Description:</span>{" "}
          {props.event.description}
        </p>

        {props.user && props.event.resources && props.event.resources.length > 0 ? (
          <div>
            <p className="text-sm font-medium text-gray-900 mb-1">Resources:</p>
            <div className="flex flex-wrap gap-2">
              {props.event.resources.map((r, index) => (
                <a
                  key={index}
                  href={typeof r === 'string' ? r : r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-orange-100 text-orange-800 text-xs font-medium px-3 py-1 rounded-full shadow hover:bg-orange-200 transition"
                  title={typeof r === 'string' ? r : r.url}
                >
                  {typeof r === 'string' ? r : r.name}
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </li>
    );
  }
};

export default Event;
