from flask import Flask, render_template, request, jsonify, session
import json
import random
from datetime import datetime
import os

app = Flask(__name__)
app.secret_key = 'your-secret-key-here-change-in-production'
app.config['SESSION_TYPE'] = 'filesystem'

# Load responses from JSON file
def load_responses():
    with open('data/responses.json', 'r', encoding='utf-8') as f:
        return json.load(f)

# Initialize responses
def initialize_responses():
    responses = load_responses()
    
    # Store user session data
    if 'conversation_history' not in session:
        session['conversation_history'] = []
    
    return responses

# Process user message
def process_message(message, responses):
    message_lower = message.lower().strip()
    
    # Check for greeting
    greetings = ['hello', 'hi', 'hey', 'greetings']
    for greeting in greetings:
        if greeting in message_lower:
            return random.choice(responses['greetings'])
    
    # Check for farewell
    farewells = ['bye', 'goodbye', 'exit', 'quit']
    for farewell in farewells:
        if farewell in message_lower:
            return random.choice(responses['farewells'])
    
    # Check for specific questions
    for category, questions in responses['questions'].items():
        for question_pattern in questions:
            if any(keyword in message_lower for keyword in question_pattern['keywords']):
                return random.choice(question_pattern['responses'])
    
    # Check for admission-related questions
    for admission_question in responses['admission_questions']:
        if any(keyword in message_lower for keyword in admission_question['keywords']):
            return random.choice(admission_question['responses'])
    
    # Default response for unknown questions
    return random.choice(responses['default_responses'])

# Routes
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/chat')
def chat():
    return render_template('chat.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/api/chat', methods=['POST'])
def chat_api():
    data = request.json
    user_message = data.get('message', '')
    
    if not user_message:
        return jsonify({'error': 'No message provided'}), 400
    
    responses = load_responses()
    bot_response = process_message(user_message, responses)
    
    # Add to conversation history
    if 'conversation_history' not in session:
        session['conversation_history'] = []
    
    conversation_entry = {
        'user': user_message,
        'bot': bot_response,
        'timestamp': datetime.now().strftime('%H:%M:%S')
    }
    
    session['conversation_history'].append(conversation_entry)
    
    return jsonify({
        'response': bot_response,
        'history': session['conversation_history']
    })

@app.route('/api/suggestions', methods=['GET'])
def get_suggestions():
    responses = load_responses()
    suggestions = []
    
    # Get some sample questions from each category
    for category, questions in responses['questions'].items():
        for question in questions[:2]:  # Take first 2 from each category
            suggestions.append(question['sample_question'])
    
    # Add admission questions
    for admission_question in responses['admission_questions'][:3]:
        suggestions.append(admission_question['sample_question'])
    
    return jsonify({'suggestions': suggestions})

@app.route('/api/clear_history', methods=['POST'])
def clear_history():
    session['conversation_history'] = []
    return jsonify({'success': True})

if __name__ == '__main__':
    # Create necessary directories
    os.makedirs('static/css', exist_ok=True)
    os.makedirs('static/js', exist_ok=True)
    os.makedirs('templates', exist_ok=True)
    os.makedirs('data', exist_ok=True)
    
    app.run(debug=True, port=5000)
