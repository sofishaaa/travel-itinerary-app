package com.example.tripplanner.data

import androidx.lifecycle.LiveData

class TripRepository(private val tripDao: TripDao) {

    val allTrips: LiveData<List<Trip>> = tripDao.getAllTrips()

    fun getTripById(id: Int): LiveData<Trip> {
        return tripDao.getTripById(id)
    }

    suspend fun insertTrip(trip: Trip) {
        tripDao.insertTrip(trip)
    }

    suspend fun updateTrip(trip: Trip) {
        tripDao.updateTrip(trip)
    }

    suspend fun deleteTrip(trip: Trip) {
        tripDao.deleteTrip(trip)
    }
}