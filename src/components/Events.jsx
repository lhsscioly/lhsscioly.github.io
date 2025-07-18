import { useState, useEffect } from "react";
import Event from "./Event";
import eventService from "../services/events";
import Modal from "./Modal";

const Events = (props) => {
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");
  const [eventsShow, setEventsShow] = useState([]);
  const [name, setName] = useState("");
  const [group, setGroup] = useState("");
  const [block, setBlock] = useState("");
  const [description, setDescription] = useState("");
  const [resource, setResource] = useState("");
  const [resources, setResources] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (filter.length === 0) {
      setEventsShow(props.events);
    } else {
      setEventsShow(
        props.events.filter((e) =>
          e.name.toLowerCase().includes(filter.toLowerCase()),
        ),
      );
    }
  }, [filter, props.events]);

  const addResource = () => {
    if (resource.trim()) {
      setResources(resources.concat(resource.trim()));
      setResource("");
    }
  };

  const handleEventAdd = async (event) => {
    event.preventDefault();
    try {
      const newEvent = await eventService.createEvent({
        name,
        block,
        group,
        description,
        resources,
      });
      props.setEvents(props.events.concat(newEvent));
      setName("");
      setBlock("");
      setGroup("");
      setDescription("");
      setResource("");
      setResources([]);
      setModalOpen(false);
      setFilter("");
    } catch (error) {
      if (
        error.response?.data?.error &&
        error.response.data.error === "expected `event name` to be unique"
      ) {
        setError("Event already added");
        setTimeout(() => {
          setError(null);
        }, 5000);
      } else {
        console.error("Failed to add event:", error);
      }
    }
  };

  const editEvent = async (id, eventObject) => {
    try {
      const updatedEvent = await eventService.changeEvent(id, eventObject);
      props.setEvents(
        props.events.map((event) =>
          event.id === updatedEvent.id ? updatedEvent : event,
        ),
      );
    } catch (error) {
      console.error("Failed to edit event:", error);
    }
  };

  const deleteEvent = async (id) => {
    try {
      await eventService.deleteEvent(id);
      props.setEvents(props.events.filter((e) => e.id !== id));
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-16 p-6 bg-white rounded-md shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-semibold text-orange-800 text-center sm:text-left flex-1">
          Science Olympiad Events
        </h2>

        <input
          type="text"
          placeholder="Filter events..."
          value={filter}
          onChange={({ target }) => setFilter(target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 w-full sm:w-1/3"
        />
      </div>

      {props.user?.admin && (
        <div className="py-4">
          <div className="flex items-center justify-center">
            <button
              onClick={() => setModalOpen(true)}
              className="text-orange-600 text-4xl pt-2 pb-4 py-2 rounded hover:text-orange-700 transition pb-2 w-full border border-orange-300 border-dashed rounded-md hover:bg-orange-100"
              title="Add Event"
            >
              +
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setName("");
          setGroup("");
          setDescription("");
          setResource("");
          setResources([]);
          setModalOpen(false);
        }}
        title="Add New Event"
      >
        {error && (
          <div
            className="mb-4 rounded-md bg-red-100 border border-red-500 text-red-800 px-4 py-3 shadow-md"
            role="alert"
          >
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        <form
          onSubmit={handleEventAdd}
          className="space-y-4 bg-orange-50 p-4 rounded-md"
        >
          <div>
            <label className="block text-sm font-medium text-orange-800 mb-1">
              Name
            </label>
            <input
              value={name}
              onChange={({ target }) => setName(target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-orange-800 mb-1">
              Category
            </label>

            <select
              name="category"
              value={group}
              onChange={({ target }) => setGroup(target.value)}
              className="w-full px-1 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 bg-orange-50 appearance-none"
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

          <div>
            <label className="block text-sm font-medium text-orange-800 mb-1">
              Block
            </label>

            <select
              name="block"
              value={block}
              onChange={({ target }) => setBlock(target.value)}
              className="w-full px-1 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 bg-orange-50 appearance-none"
            >
              <option value="">Self Schedule</option>
              <option value="1">Block 1</option>
              <option value="2">Block 2</option>
              <option value="3">Block 3</option>
              <option value="4">Block 4</option>
              <option value="4">Block 5</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-orange-800 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={({ target }) => setDescription(target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 resize-y min-h-[100px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-orange-800 mb-1">
              Add Resource
            </label>
            <div className="flex gap-2">
              <input
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

          <div className="mt-4 space-y-2">
            {resources.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {resources.map((r) => (
                  <div
                    key={r}
                    className="flex items-center bg-orange-100 text-orange-800 text-xs font-medium px-3 py-1 rounded-full shadow hover:bg-orange-200 transition"
                  >
                    <a
                      href={r}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate max-w-[140px] hover:underline"
                    >
                      {r}
                    </a>
                    <button
                      onClick={() =>
                        setResources(resources.filter((res) => res !== r))
                      }
                      className="ml-2 text-gray-500 text-lg hover:text-red-600 font-bold"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-orange-600 text-white py-2 rounded-md hover:bg-orange-700 transition"
          >
            Add Event
          </button>
        </form>
      </Modal>

      <ul className="space-y-4">
        {eventsShow.map((e) => (
          <Event
            user={props.user}
            key={e.id}
            event={e}
            editEvent={editEvent}
            deleteEvent={deleteEvent}
          />
        ))}
      </ul>
    </div>
  );
};

export default Events;
