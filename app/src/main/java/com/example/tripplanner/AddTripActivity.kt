package com.example.tripplanner

import android.os.Bundle
import android.widget.Button
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import com.example.tripplanner.data.Trip
import com.google.android.material.appbar.MaterialToolbar
import com.google.android.material.textfield.TextInputEditText

class AddTripActivity : AppCompatActivity() {

    private lateinit var viewModel: TripViewModel
    private var editTripId: Int = -1

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_add_trip)

        val toolbar = findViewById<MaterialToolbar>(R.id.toolbar)
        setSupportActionBar(toolbar)
        toolbar.setNavigationOnClickListener { finish() }

        val etTitle = findViewById<TextInputEditText>(R.id.etTitle)
        val etDestination = findViewById<TextInputEditText>(R.id.etDestination)
        val etStartDate = findViewById<TextInputEditText>(R.id.etStartDate)
        val etEndDate = findViewById<TextInputEditText>(R.id.etEndDate)
        val etBudget = findViewById<TextInputEditText>(R.id.etBudget)
        val etNotes = findViewById<TextInputEditText>(R.id.etNotes)
        val btnSave = findViewById<Button>(R.id.btnSave)

        viewModel = ViewModelProvider(this)[TripViewModel::class.java]

        // Перевіряємо чи це редагування
        editTripId = intent.getIntExtra("TRIP_ID", -1)
        if (editTripId != -1) {
            toolbar.title = getString(R.string.edit_trip)
            viewModel.getTripById(editTripId).observe(this) { trip ->
                trip?.let {
                    etTitle.setText(it.title)
                    etDestination.setText(it.destination)
                    etStartDate.setText(it.startDate)
                    etEndDate.setText(it.endDate)
                    etBudget.setText(it.budget.toString())
                    etNotes.setText(it.notes)
                }
            }
        }

        btnSave.setOnClickListener {
            val title = etTitle.text.toString().trim()
            val destination = etDestination.text.toString().trim()
            val startDate = etStartDate.text.toString().trim()
            val endDate = etEndDate.text.toString().trim()
            val budgetStr = etBudget.text.toString().trim()
            val notes = etNotes.text.toString().trim()

            if (title.isEmpty() || destination.isEmpty() || startDate.isEmpty()
                || endDate.isEmpty() || budgetStr.isEmpty()) {
                Toast.makeText(this, R.string.fill_required_fields, Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val budget = budgetStr.toDoubleOrNull() ?: 0.0

            val trip = Trip(
                id = if (editTripId != -1) editTripId else 0,
                title = title,
                destination = destination,
                startDate = startDate,
                endDate = endDate,
                budget = budget,
                notes = notes
            )

            if (editTripId != -1) {
                viewModel.updateTrip(trip)
                Toast.makeText(this, R.string.trip_updated, Toast.LENGTH_SHORT).show()
            } else {
                viewModel.insertTrip(trip)
                Toast.makeText(this, R.string.trip_added, Toast.LENGTH_SHORT).show()
            }
            finish()
        }
    }
}